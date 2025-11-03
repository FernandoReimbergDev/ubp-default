/* eslint-disable @typescript-eslint/no-explicit-any */
import https from "https";
import { NextRequest, NextResponse } from "next/server";
import { getDecryptedToken } from "../../services/getDecryptedToken";
import { ENVIRONMENT, STORE_ID } from "../../utils/env";
import { stock } from "../../types/responseTypes";

interface ProdutoResponse {
    success: boolean;
    message: string;
    result: { produtos: stock[] };
}

/** =========
 *  Agent keep-alive em escopo de módulo (reusa conexão/TLS entre requests)
 *  ========= */
const agent = new https.Agent({
    keepAlive: true,
    maxSockets: 100,
    maxFreeSockets: 20,
    keepAliveMsecs: 15_000,
    timeout: 10_000, // idle socket timeout
});

/** Timeout util */
function withTimeout<T>(p: Promise<T>, ms: number, name = "operation"): Promise<T> {
    let to: NodeJS.Timeout;
    const timeout = new Promise<never>((_, reject) => {
        to = setTimeout(() => reject(new Error(`${name} timeout after ${ms}ms`)), ms);
    });
    return Promise.race([p, timeout]).finally(() => clearTimeout(to!));
}

export async function POST(req: NextRequest) {
    const t0 = Date.now();
    try {
        const url = new URL(req.url);
        const raw = url.searchParams.get("raw") === "1";

        const storeId = STORE_ID;
        if (!storeId) {
            return NextResponse.json({ success: false, message: "Dados inválidos." }, { status: 400 });
        }

        const { codPro, descrProCor, descrProTamanho, chavePro } = await req.json();

        const tokenStart = Date.now();
        const token = await withTimeout(getDecryptedToken(), 2_000, "token");
        const tokenMs = Date.now() - tokenStart;

        if (!token) {
            return NextResponse.json({ success: false, message: "Erro ao obter token." }, { status: 500 });
        }

        const postData = JSON.stringify({
            storeId: Number(storeId), codPro: codPro, descrProCor: descrProCor, descrProTamanho: descrProTamanho
        });

        const reqStart = Date.now();
        const responseData = await withTimeout<ProdutoResponse>(
            new Promise<ProdutoResponse>((resolve, reject) => {
                const options: https.RequestOptions = {
                    method: "GET",
                    hostname: "unitybrindes.com.br",
                    port: 443,
                    path: `/product-stock/${String(chavePro)}`,
                    agent,
                    headers: {
                        "Content-Type": "application/json",
                        "Content-Length": Buffer.byteLength(postData),
                        "X-Environment": ENVIRONMENT,
                        "Accept-Encoding": "identity",
                        Connection: "keep-alive",
                        Authorization: `Bearer ${token}`,
                        "Cache-Control": "no-cache",
                    },
                };

                const externalReq = https.request(options, (res) => {
                    const ttfbStart = Date.now();
                    let firstChunk = true;
                    let ttfbMs = 0;

                    // Coleta como string (evita Buffer.concat)
                    res.setEncoding("utf8");
                    let body = "";

                    // reduzir latência de envio de pacotes
                    res.socket?.setNoDelay(true);

                    res.on("data", (chunk: string) => {
                        if (firstChunk) {
                            firstChunk = false;
                            ttfbMs = Date.now() - ttfbStart;
                        }
                        body += chunk;
                    });

                    res.on("end", () => {
                        const downloadMs = Date.now() - (reqStart + ttfbMs);
                        // Parse
                        try {
                            const parseStart = Date.now();
                            const parsed = JSON.parse(body);
                            const parseMs = Date.now() - parseStart;

                            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                                // Log condicional e compacto
                                const totalMs = Date.now() - reqStart;
                                if (totalMs > 500) {
                                    console.log("[stock] ext timings(ms)", {
                                        token_ms: tokenMs,
                                        ttfb_ms: ttfbMs,
                                        download_ms: downloadMs,
                                        parse_ms: parseMs,
                                        total_ms: totalMs,
                                        bytes: body.length,
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

                // timeouts de request/TTFB
                externalReq.setTimeout(4_000, () => {
                    externalReq.destroy(new Error("External request timeout"));
                });

                // diminuir latência do envio
                externalReq.socket?.setNoDelay(true);

                externalReq.on("error", (err) => reject(err));

                externalReq.write(postData);
                externalReq.end();
            }),
            6_000,
            "external"
        );

        const totalMs = Date.now() - t0;
        if (totalMs > 1000) {
            console.log(`[stock] total took ${totalMs}ms (incl. token=${tokenMs}ms)`);
        }

        if (raw) {
            // evita re-empacotar mais uma vez (mas mantém JSON)
            return NextResponse.json(responseData);
        }

        return NextResponse.json({ success: true, data: responseData });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        console.error("Erro na rota /api/products:", message);
        return NextResponse.json(
            { success: false, message: "Erro ao buscar estoque do produto", details: message },
            { status: 500 }
        );
    }
}
