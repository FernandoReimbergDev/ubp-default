import https from "https";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import colors from "../../../../../cores.json";
import { getDecryptedToken } from "../../../services/getDecryptedToken";
import { sendEmail } from "../../../services/sendEmail";
import { PasswordRecoveryResult } from "../../../types/responseTypes";
import { ENVIRONMENT, STORE_ID, NOME_LOJA } from "../../../utils/env";

export async function POST(req: NextRequest) {
  try {
    const storeId = STORE_ID;
    const { username, email } = await req.json();
    if (!storeId || !username || typeof username !== "string") {
      return NextResponse.json({ success: false, message: "Dados inválidos." }, { status: 400 });
    }

    const token = await getDecryptedToken();

    if (!token) {
      return NextResponse.json({ success: false, message: "Erro ao obter token de autenticação." }, { status: 500 });
    }

    const postData = JSON.stringify({
      storeId: Number(storeId),
      username: username,
    });

    const responseData = await new Promise<{ success: boolean; message: string; result?: PasswordRecoveryResult }>(
      (resolve, reject) => {
        const options: https.RequestOptions = {
          method: "GET",
          hostname: "unitybrindes.com.br",
          path: "/password-recovery-code",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(postData).toString(),
            "X-Environment": ENVIRONMENT,
            Authorization: `Bearer ${token}`,
            Cookie: "PHPSESSID=ptcn93kuejvhigi0k0gv010c97",
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
                resolve({
                  success: true,
                  message: parsed.message || "Código enviado com sucesso",
                  ...(parsed.result && { result: parsed.result }),
                });
              } else {
                console.error("Erro da API externa:", parsed);
                reject(new Error(parsed.message || "Erro ao solicitar código"));
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
      }
    );
    if (responseData.result?.passwordRecoveryCode) {
      const htmlTemplate = `
            <!DOCTYPE html>
            <html lang="pt-BR">
                <head>
                    <meta charset="UTF-8" />
                    <title>Verificação de e-mail</title>
                    <style>
                        body {
                            background-color: #f4f4f4;
                            font-family: Arial, sans-serif;
                            margin: 0;
                            padding: 0;
                            }

                        .container {
                            max-width: 600px;
                            margin: 30px auto;
                            background-color: #ffffff;
                            border-radius: 8px;
                            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                            overflow: hidden;
                        }

                        .header {
                        background-color: ${colors.TemplateEmail.bgLogo};
                        padding: 20px;
                        text-align: left;
                        }

                        .header img {
                        max-width: 150px;
                        }

                        .content {
                        padding: 20px;
                        color: ${colors.TemplateEmail.fontColor};
                        font-size: 14px;
                        }

                        .content h1 {
                        color: ${colors.TemplateEmail.codeColor};
                        }

                        .code {
                        font-size: 28px;
                        font-weight: bold;
                        color: ${colors.TemplateEmail.codeColor};
                        text-align: center;
                        margin: 20px 0;
                        }

                        .footer {
                        background-color:  ${colors.TemplateEmail.footerColor};
                        padding: 15px;
                        font-size: 12px;
                        color: #888;
                        text-align: center;
                        }
                </style>
            </head>

        <body>
        <div class="container">
        <div class="header">
            <img src="https://www2.unitycorp.com.br/teste/logo-header.png" alt={"logo" ${NOME_LOJA}}/>
        </div>
        <div class="content">
            <h1>Olá!</h1>
            <p>Você solicitou um código de verificação para acessar a plataforma da <strong>${NOME_LOJA}</strong>.</p>
            <div class="code">${responseData.result?.passwordRecoveryCode}</div>
            <p>Este código expira em 5 minutos.</p>
            <p>Se você não solicitou este código, pode ignorar este e-mail com segurança.</p>
            <p>Atenciosamente,<br />Equipe Unity Brindes</p>
                  <img src="https://www2.unitycorp.com.br/teste/rodape-email.png" alt="assinatura e-mail Unity Brindes" />
        </div>
        <div class="footer">
            Este é um e-mail automático. Por favor, não responda.
            </div>
            </div>
    </body>

    </html>
            `;

      await sendEmail(
        email,
        "Seu código de verificação",
        `Seu código é: ${responseData.result?.passwordRecoveryCode}`,
        htmlTemplate
      );
      return NextResponse.json(
        {
          success: true,
          status: "code-sent",
          message: "Código enviado para o e-mail informado.",
        },
        { status: 200 }
      );
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Erro interno ao solicitar código", err.message);
      return NextResponse.json(
        { success: false, message: "Erro interno ao solicitar código", details: err.message },
        { status: 500 }
      );
    } else {
      console.error("Erro interno desconhecido ao solicitar código:", err);
      return NextResponse.json(
        { success: false, message: "Erro interno desconhecido ao solicitar código" },
        { status: 500 }
      );
    }
  }
}
