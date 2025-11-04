/* eslint-disable @typescript-eslint/no-explicit-any */
import https from "https";
import { NextResponse } from "next/server";
import { getDecryptedToken } from "../../services/getDecryptedToken";
import { ENVIRONMENT, STORE_ID } from "../../utils/env";
import { Produto } from "../../types/responseTypes";

interface ProdutoResponse {
  success: boolean;
  result: { produtos: Produto[] };
}

const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 128,
  maxFreeSockets: 32,
  keepAliveMsecs: 15_000,
  timeout: 10_000,
});

async function withTimeout<T>(p: Promise<T>, ms: number, name = "operation"): Promise<T> {
  let to: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) =>
    (to = setTimeout(() => reject(new Error(`${name} timeout after ${ms}ms`)), ms))
  );
  try {
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(to!);
  }
}

export async function POST() {
  try {
    const storeId = STORE_ID;
    if (!storeId) {
      return NextResponse.json({ success: false, message: "Dados inválidos." }, { status: 400 });
    }

    const token = await withTimeout(getDecryptedToken(), 2_000, "token");
    if (!token) {
      return NextResponse.json({ success: false, message: "Erro ao obter token de autenticação." }, { status: 500 });
    }

    const postData = JSON.stringify({ storeId: Number(storeId), disponivelProCor: 1 });

    const responseData = await withTimeout<ProdutoResponse | any>(
      new Promise((resolve, reject) => {
        const options: https.RequestOptions = {
          method: "GET",
          hostname: "unitybrindes.com.br",
          port: null,
          path: "/products",
          agent,
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(postData),
            "X-Environment": ENVIRONMENT,
            Authorization: `Bearer ${token}`,
            Connection: "keep-alive",
            "Cache-Control": "no-cache",
            // opcional: força sem compressão (evita precisar descomprimir)
            // "Accept-Encoding": "identity",
            Accept: "application/json",
          },
        };

        const externalReq = https.request(options, (res) => {
          let body = "";
          res.setEncoding("utf8");
          res.socket?.setNoDelay(true);

          res.on("data", (chunk: string) => (body += chunk));

          res.on("aborted", () => {
            reject(new Error("Resposta abortada pela origem"));
          });

          res.on("end", () => {
            const status = res.statusCode ?? 0;
            const ctype = res.headers["content-type"] || "";
            const clen = res.headers["content-length"];

            // 1) Se status não for 2xx, tente extrair mensagem mas não parseie à força
            if (status < 200 || status >= 300) {
              let msg = `Erro da API externa (${status})`;
              try {
                if (body && ctype.toString().includes("application/json")) {
                  const errJson = JSON.parse(body);
                  msg = errJson?.message || msg;
                }
              } catch { /* ignore */ }
              console.error("[/products] non-2xx", { status, ctype, clen, preview: body?.slice(0, 300) });
              return reject(new Error(msg));
            }

            // 2) Se o body está vazio, não tente JSON.parse
            if (!body || body.trim() === "") {
              console.warn("[/products] body vazio", { status, ctype, clen });
              // Decida o que retornar (aqui retorno um objeto vazio coerente)
              return resolve({ success: true, result: { produtos: [] } });
            }

            // 3) Tente parsear só se content-type indicar JSON
            if (!ctype.toString().includes("application/json")) {
              console.warn("[/products] content-type não JSON", { status, ctype, clen, preview: body.slice(0, 120) });
              // Se precisar, retorne o texto cru ou tente parse mesmo assim
              try {
                const parsedAnyway = JSON.parse(body);
                return resolve(parsedAnyway);
              } catch {
                return resolve({ success: true, raw: body });
              }
            }

            // 4) Parse normal
            try {
              const parsed = JSON.parse(body);
              return resolve(parsed);
            } catch (e: any) {
              console.error("[/products] JSON.parse falhou", {
                status,
                ctype,
                clen,
                err: e?.message,
                preview: body.slice(0, 200),
              });
              return reject(new Error(`Erro ao interpretar resposta da API externa: ${e?.message || e}`));
            }
          });

          res.on("error", (err) => reject(err));
        });

        externalReq.setTimeout(4_000, () => {
          externalReq.destroy(new Error("External request timeout"));
        });

        externalReq.on("socket", (s) => s.setNoDelay(true));
        externalReq.on("error", (err) => reject(err));

        externalReq.write(postData);
        externalReq.end();
      }),
      6_000,
      "external"
    );

    return NextResponse.json({ success: true, data: responseData });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("Erro na rota /api/products:", message);
    return NextResponse.json(
      { success: false, message: "Erro ao buscar produtos", details: message },
      { status: 500 }
    );
  }
}
