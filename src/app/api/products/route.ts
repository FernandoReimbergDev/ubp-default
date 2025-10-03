import https from "https";
import { NextResponse } from "next/server";
import { getDecryptedToken } from "../../services/getDecryptedToken";
import { API_REQ_APPLICATION, ENVIRONMENT, STORE_ID } from "../../utils/env";
import { Produto } from "../../types/responseTypes";

interface ProdutoResponse {
  success: boolean;
  result: {
    produtos: Produto[];
  };
}

export async function POST() {
  try {
    const storeId = STORE_ID;

    if (!storeId) {
      return NextResponse.json({ success: false, message: "Dados inválidos." }, { status: 400 });
    }

    const token = await getDecryptedToken(API_REQ_APPLICATION);

    if (!token) {
      return NextResponse.json({ success: false, message: "Erro ao obter token." }, { status: 500 });
    }

    const postData = JSON.stringify({
      storeId: Number(storeId),
      disponivelProCor: 1,
    });

    const responseData = await new Promise<ProdutoResponse>((resolve, reject) => {
      const options: https.RequestOptions = {
        method: "GET",
        hostname: "unitybrindes.com.br",
        port: null,
        path: "/products",
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
          // console.log('RESPOSTA DA API EXTERNA:', body);

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
    return NextResponse.json({ success: false, message: "Erro ao buscar produtos", details: message }, { status: 500 });
  }
}
