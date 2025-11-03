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

/* =========
 * Agent keep-alive em escopo de módulo
 * ========= */
const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 128,
  maxFreeSockets: 32,
  keepAliveMsecs: 15_000,
  timeout: 10_000, // idle socket timeout
});

/* Timeout helper */
function withTimeout<T>(p: Promise<T>, ms: number, name = "operation"): Promise<T> {
  let to: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) =>
    (to = setTimeout(() => reject(new Error(`${name} timeout after ${ms}ms`)), ms))
  );
  return Promise.race([p, timeout]).finally(() => clearTimeout(to!));
}

export async function POST() {
  const t0 = Date.now();
  try {
    const storeId = STORE_ID;
    if (!storeId) {
      return NextResponse.json({ success: false, message: "Dados inválidos." }, { status: 400 });
    }

    // Token (mantenha seu getDecryptedToken; aqui só medimos e aplicamos timeout)
    const tToken0 = Date.now();
    const token = await withTimeout(getDecryptedToken(), 2_000, "token");
    const decrypt_ms = Date.now() - tToken0;

    if (!token) {
      return NextResponse.json({ success: false, message: "Erro ao obter token de autenticação." }, { status: 500 });
    }

    // Mantém JSON.stringify para máxima segurança
    const postData = JSON.stringify({
      storeId: Number(storeId),
      disponivelProCor: 1,
    });

    const reqStart = Date.now();
    const responseData = await withTimeout<ProdutoResponse>(
      new Promise<ProdutoResponse>((resolve, reject) => {
        const options: https.RequestOptions = {
          method: "GET",
          hostname: "unitybrindes.com.br",
          port: 443,
          path: "/products",
          agent,
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(postData),
            "X-Environment": ENVIRONMENT,
            Authorization: `Bearer ${token}`,
            Connection: "keep-alive",
            "Cache-Control": "no-cache",
          },
        };

        const externalReq = https.request(options, (res) => {
          const ttfbStart = Date.now();
          let firstChunk = true;
          let ttfb_ms = 0;

          res.setEncoding("utf8");
          let body = "";

          // reduzir latência de envio de pacotes
          res.socket?.setNoDelay(true);

          res.on("data", (chunk: string) => {
            if (firstChunk) {
              firstChunk = false;
              ttfb_ms = Date.now() - ttfbStart;
            }
            body += chunk;
          });

          res.on("end", () => {
            const download_ms = Date.now() - (reqStart + ttfb_ms);
            try {
              const parseStart = Date.now();
              const parsed = JSON.parse(body);
              const parse_ms = Date.now() - parseStart;

              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                const total_ms = Date.now() - reqStart;
                if (total_ms > 500) {
                  console.log("[products] ext timings(ms)", {
                    decrypt_ms,
                    ttfb_ms,
                    download_ms,
                    parse_ms,
                    total_ms,
                    bytes: body.length,
                    status: res.statusCode,
                  });
                }
                resolve(parsed);
              } else {
                reject(new Error((parsed as any)?.message || `Erro da API externa (${res.statusCode})`));
              }
            } catch (e: any) {
              reject(new Error(`Erro ao interpretar resposta da API externa: ${e?.message || e}`));
            }
          });

          res.on("error", (err) => reject(err));
        });

        // timeout de request/TTFB — evita pendurar
        externalReq.setTimeout(4_000, () => {
          externalReq.destroy(new Error("External request timeout"));
        });

        externalReq.on("socket", (socket) => {
          socket.setNoDelay(true);
        });

        externalReq.on("error", (err) => reject(err));

        // Mantém GET com body + JSON.stringify
        externalReq.write(postData);
        externalReq.end();
      }),
      6_000,
      "external"
    );

    const total_ms = Date.now() - t0;
    if (total_ms > 1000) {
      console.log("[products] total took", total_ms, "ms", "(incl. decrypt=", decrypt_ms, "ms)");
    }

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
