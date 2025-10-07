import { NextRequest, NextResponse } from "next/server";
import https from "https";
import { API_REQ_APPLICATION, STORE_ID, ENVIRONMENT } from "../../utils/env";
import { getDecryptedToken } from "../../services/getDecryptedToken";
import { UsuarioResponse } from "../../types/responseTypes";

export async function POST(req: NextRequest) {
  try {
    const storeId = Number(STORE_ID);
    const userIsActive = 1;
    const userIsDeleted = 0;

    // Pega o JWT do cookie 'auth'
    const jwt = req.cookies.get("auth")?.value;
    if (!jwt) {
      return NextResponse.json({ success: false, message: "Token auth não encontrado" }, { status: 401 });
    }

    // Decodifica o payload do JWT
    const payload = jwt.split(".")[1];
    if (!payload) {
      return NextResponse.json({ success: false, message: "JWT malformado" }, { status: 401 });
    }
    const jsonPayload = Buffer.from(payload, "base64").toString("utf8");
    const { sub } = JSON.parse(jsonPayload);
    const userId = sub;
    if ([storeId, userId, userIsActive, userIsDeleted].some((v) => v === undefined || v === null)) {
      return NextResponse.json({ success: false, message: "Credenciais ou StoreID ausentes" }, { status: 400 });
    }

    const postData = JSON.stringify({
      storeId,
      userIsActive,
      userIsDeleted,
      userId: Number(userId),
    });

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, message: "Corpo da requisição inválido" }, { status: 400 });
    }

    console.log("/api/cadastro-usuario payload:", body);

    const token = await getDecryptedToken(API_REQ_APPLICATION);

    // const responseData = await new Promise<UsuarioResponse>((resolve, reject) => {
    //   const options: https.RequestOptions = {
    //     method: "GET",
    //     hostname: "unitybrindes.com.br",
    //     port: null,
    //     path: "/adicionar-usuario",
    //     headers: {
    //       "Content-Type": "application/json",
    //       "Content-Length": Buffer.byteLength(postData),
    //       "X-Environment": ENVIRONMENT,
    //       Authorization: `Bearer ${token}`,
    //     },
    //   };

    //   const externalReq = https.request(options, (res) => {
    //     const chunks: Uint8Array[] = [];
    //     res.on("data", (chunk) => {
    //       chunks.push(chunk);
    //     });
    //     res.on("end", () => {
    //       const body = Buffer.concat(chunks).toString();
    //       console.log("RESPOSTA DA API EXTERNA:", body);
    //       try {
    //         const parsed = JSON.parse(body);
    //         if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
    //           resolve(parsed);
    //         } else {
    //           reject(new Error(parsed.message || "Erro da API externa"));
    //         }
    //       } catch {
    //         reject(new Error("Erro ao interpretar resposta da API externa"));
    //       }
    //     });
    //   });
    //   externalReq.on("error", (err) => {
    //     reject(err);
    //   });
    //   externalReq.write(postData);
    //   externalReq.end();
    // });

    // Aqui você chamaria a API externa com postData + body quando necessário.
    // Por ora, apenas ecoamos os dados recebidos.
    return NextResponse.json({ success: true, received: body, meta: { storeId, userId } }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("Erro na rota /api/cadastro-usuario:", message);
    return NextResponse.json(
      { success: false, message: "Erro ao cadastrar usuário", details: message },
      { status: 500 }
    );
  }
}
