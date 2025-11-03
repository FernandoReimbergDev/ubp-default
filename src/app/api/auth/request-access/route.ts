import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sendEmail } from "../../../services/sendEmail";
import { STORE_ID, ENVIRONMENT, NOME_LOJA } from "../../../utils/env";
import colors from "../../../../../cores.json";
import { getDecryptedToken } from "../../../services/getDecryptedToken";

export async function POST(req: NextRequest) {
  try {
    const storeId = STORE_ID;
    const { userName } = await req.json();

    if (!userName) {
      return NextResponse.json({ success: false, message: "Username inválido." }, { status: 400 });
    }

    const token = await getDecryptedToken();
    if (!token) {
      return NextResponse.json({ success: false, message: "Erro ao obter token de autenticação." }, { status: 500 });
    }

    const url = "https://unitybrindes.com.br/pre-authenticate";

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Environment": ENVIRONMENT,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        storeId: Number(storeId),
        username: userName,
      }),
    };

    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) {
      return new NextResponse(JSON.stringify(data), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (data.result.firstAccess != 1) {
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
            <div class="code">${data.result.firstAccessActivationCode}</div>
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
        data.result.email,
        "Seu código de verificação",
        `Seu código é: ${data.result.firstAccessActivationCode}`,
        htmlTemplate
      );
      return NextResponse.json(
        {
          success: true,
          status: "code-sent",
          message: "Código enviado para o e-mail informado.",
          email: data.result.email,
          firstAccess: data.result.firstAccess,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        status: "can-login",
        email: data.result.email,
        message: data.message,
        firstAccess: data.result.firstAccess
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    return NextResponse.json({ success: false, message: "Erro interno ao requisitar acesso.", err }, { status: 500 });
  }
}
