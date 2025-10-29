import https from "https";
import { NextResponse } from "next/server";
import { getDecryptedToken } from "../../services/getDecryptedToken";
import { API_REQ_APPLICATION, STORE_ID, BASE_URL } from "../../utils/env";

interface DynamicRequestBody {
  reqMethod: "GET" | "POST" | "PUT" | "DELETE";
  reqEndpoint: string;
  reqHeaders?: Record<string, string>;
}

export async function POST(request: Request) {
  try {
    const baseUrl = BASE_URL?.trim();
    const storeId = STORE_ID;
    const body: DynamicRequestBody = await request.json();
    const { reqMethod, reqEndpoint, reqHeaders } = body;

    if (!baseUrl || !/^https?:\/\//.test(baseUrl)) {
      return NextResponse.json({ success: false, message: `Base URL inválida (${baseUrl})` }, { status: 400 });
    }

    if (!reqMethod || !reqEndpoint) {
      return NextResponse.json({ success: false, message: "Método ou endpoint ausente." }, { status: 400 });
    }

    const token = await getDecryptedToken(API_REQ_APPLICATION);
    if (!token) {
      return NextResponse.json({ success: false, message: "Erro ao obter token." }, { status: 500 });
    }

    const postData = JSON.stringify({
      storeId: storeId,
      ...reqHeaders,
    });

    const responseData = await new Promise<DynamicRequestBody>((resolve, reject) => {
      const options: https.RequestOptions = {
        method: reqMethod,
        hostname: "unitybrindes.com.br",
        port: null,
        path: reqEndpoint,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
          ...reqHeaders,
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
          // console.log("RESPOSTA DA API EXTERNA:", body);
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
    console.error("Erro na rota /api/dynamic:", message);
    return NextResponse.json(
      { success: false, message: "Erro ao processar requisição dinâmica", details: message },
      { status: 500 }
    );
  }
}
