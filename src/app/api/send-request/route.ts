/* eslint-disable @typescript-eslint/no-explicit-any */
import https from "https";
import { NextResponse } from "next/server";
import { getDecryptedToken } from "../../services/getDecryptedToken";
import { STORE_ID, BASE_URL } from "../../utils/env";

interface DynamicRequestBody {
  reqMethod: "GET" | "POST" | "PUT" | "DELETE";
  reqEndpoint: string; // ex: "/products" ou "products"
  reqHeaders?: Record<string, string>; // headers extras a enviar
}

// ========= Agent keep-alive (reuso de TLS/conexões) =========
const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 128,
  maxFreeSockets: 32,
  keepAliveMsecs: 15_000,
  timeout: 10_000, // idle
});

// ========= Helper de timeout =========
function withTimeout<T>(p: Promise<T>, ms: number, name = "operation"): Promise<T> {
  let to: NodeJS.Timeout;
  const t = new Promise<never>((_, reject) => {
    to = setTimeout(() => reject(new Error(`${name} timeout after ${ms}ms`)), ms);
  });
  return Promise.race([p, t]).finally(() => clearTimeout(to!));
}

// ========= Util: join de paths sem duplicar barras =========
function joinPath(basePath: string, endpoint: string) {
  const a = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
  const b = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${a}${b}`;
}

export async function POST(request: Request) {
  try {
    const baseUrl = BASE_URL?.trim();
    const storeId = STORE_ID;

    const body: DynamicRequestBody = await request.json();
    const { reqMethod, reqEndpoint, reqHeaders } = body;

    if (!baseUrl || !/^https?:\/\//i.test(baseUrl)) {
      return NextResponse.json({ success: false, message: `Base URL inválida (${baseUrl})` }, { status: 400 });
    }
    if (!storeId) {
      return NextResponse.json({ success: false, message: "STORE_ID inválido." }, { status: 400 });
    }

    // Proteção: só permite POST em /order se tiver userId nos headers (checkout)
    if (reqMethod === "POST" && reqEndpoint === "/order") {
      const userId = reqHeaders?.userId;
      if (!userId) {
        return NextResponse.json(
          {
            success: false,
            message: "Não é permitido criar pedido sem userId. Esta operação só pode ser feita no checkout.",
          },
          { status: 403 }
        );
      }
    }
    if (!reqMethod || !reqEndpoint) {
      return NextResponse.json({ success: false, message: "Método ou endpoint ausente." }, { status: 400 });
    }

    // Token (mantemos sua função; só medimos e protegemos com timeout)
    const token = await withTimeout(getDecryptedToken(), 2_000, "token");

    if (!token) {
      return NextResponse.json({ success: false, message: "Erro ao obter token." }, { status: 500 });
    }

    // Mantém JSON.stringify para máxima segurança (GET com body preservado)
    const postData = JSON.stringify({
      storeId,
      ...reqHeaders, // (mantido do seu código original)
    });

    // Parse do BASE_URL para extrair host/porta/caminho base
    const u = new URL(baseUrl);
    const hostname = u.hostname;
    const port = u.port ? Number(u.port) : u.protocol === "http:" ? 80 : 443;
    const path = joinPath(u.pathname || "", reqEndpoint);

    const responseData = await withTimeout<any>(
      new Promise<any>((resolve, reject) => {
        const options: https.RequestOptions = {
          method: reqMethod,
          hostname,
          port,
          path,
          agent,
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(postData),
            Connection: "keep-alive",
            storeId: storeId,
            ...(reqHeaders || {}),
            Authorization: `Bearer ${token}`,
          },
        };

        const externalReq = https.request(options, (res) => {
          let firstChunk = true;

          res.setEncoding("utf8"); // evita Buffer.concat
          let respBody = "";

          res.socket?.setNoDelay(true);

          res.on("data", (chunk: string) => {
            if (firstChunk) {
              firstChunk = false;
            }
            respBody += chunk;
          });

          res.on("end", () => {
            const ct = (res.headers["content-type"] || "").toString().toLowerCase();
            const trimmed = respBody ? respBody.trim() : "";
            const looksJson = trimmed.startsWith("{") || trimmed.startsWith("[");

            // Se não aparenta ser JSON ou content-type não indica JSON, rejeita com detalhes
            if (!looksJson || (ct && !ct.includes("application/json"))) {
              const snippet = trimmed.slice(0, 200);
              const status = res.statusCode;
              return reject(
                new Error(
                  `Resposta não-JSON da API externa (status=${status}, content-type=${
                    ct || "desconhecido"
                  }): ${snippet}`
                )
              );
            }

            try {
              const parsed = trimmed ? JSON.parse(trimmed) : {};
              // try {
              //   console.log("[send-request] Upstream response", {
              //     statusCode: res.statusCode,
              //     headers: res.headers,
              //     body: parsed,
              //   });
              // } catch { }
              resolve(parsed);
            } catch (e: any) {
              return reject(new Error(`Erro ao interpretar resposta da API externa: ${e?.message || e}`));
            }
          });

          res.on("error", (err) => reject(err));
        });

        // Timeout de request/TTFB
        externalReq.setTimeout(4_000, () => {
          externalReq.destroy(new Error("External request timeout"));
        });

        externalReq.on("socket", (s) => s.setNoDelay(true));
        externalReq.on("error", (err) => reject(err));

        // Mantém GET/POST/PUT/DELETE com body + JSON.stringify
        externalReq.write(postData);
        externalReq.end();
      }),
      6_000,
      "external"
    );

    return NextResponse.json({ success: true, data: responseData });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("Erro na rota /api/dynamic:", message);
    return NextResponse.json(
      { success: false, message: "Erro ao processar requisição dinâmica", details: message },
      { status: 500 }
    );
  }
}
