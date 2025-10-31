import https from "https";
import { NextRequest, NextResponse } from "next/server";
import { getDecryptedToken } from "../../services/getDecryptedToken";
import { API_REQ_APPLICATION, ENVIRONMENT, STORE_ID } from "../../utils/env";
import { stock } from "../../types/responseTypes";

interface ProdutoResponse {
    success: boolean;
    message: string;
    result: {
        produtos: stock[];
    };
}

export async function POST(req: NextRequest) {
    try {
        const storeId = STORE_ID;
        const { codPro, descrProCor, descrProTamanho, chavePro } = await req.json();


        if (!storeId) {
            return NextResponse.json({ success: false, message: "Dados inválidos." }, { status: 400 });
        }

        const token = await getDecryptedToken(API_REQ_APPLICATION);

        if (!token) {
            return NextResponse.json({ success: false, message: "Erro ao obter token." }, { status: 500 });
        }

        const postData = JSON.stringify({
            storeId: Number(storeId),
            codPro: codPro,
            descrProCor: descrProCor,
            descrProTamanho: descrProTamanho
        });

        const responseData = await new Promise<ProdutoResponse>((resolve, reject) => {

            const options: https.RequestOptions = {
                method: "GET",
                hostname: "unitybrindes.com.br",
                port: null,
                "path": `/product-stock/${chavePro}`,
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(postData), // <- ESSENCIAL
                    "X-Environment": ENVIRONMENT,
                    Authorization: `Bearer ${token}`,
                },
            };

            const externalReq = https.request(options, (res) => {
                const chunks: Uint8Array[] = [];

                res.on("data", (chunk) => {
                    chunks.push(chunk);
                });

                res.on("end", () => {
                    const body = Buffer.concat(chunks).toString();
                    try {
                        const parsed = JSON.parse(body);
                        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(parsed);
                        } else {
                            reject(new Error(parsed.message || "Erro da API externa"));
                        }
                    } catch {
                        reject(new Error("Erro ao interpretar resposta da API externa"));
                    }
                });
            });

            externalReq.on("error", (err) => {
                reject(err);
            });

            externalReq.write(postData);
            externalReq.end();
        });

        return NextResponse.json({ success: true, data: responseData });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        console.error("Erro na rota /api/products:", message);
        return NextResponse.json({ success: false, message: "Erro ao buscar estoque do produto", details: message }, { status: 500 });
    }
}
