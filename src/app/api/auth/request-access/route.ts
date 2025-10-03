import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sendEmail } from "../../../services/sendEmail";
import { API_REQ_APPLICATION, STORE_ID, ENVIRONMENT } from "../../../utils/env";
import colors from "../../../../../cores.json";
import assinatura from "../../../../../public/rodape-email.png";
import { getDecryptedToken } from "../../../services/getDecryptedToken";

export async function POST(req: NextRequest) {
  try {
    const storeId = STORE_ID;
    const { userName } = await req.json();

    console.log(userName);

    if (!userName) {
      return NextResponse.json({ success: false, message: "Username inválido." }, { status: 400 });
    }

    const token = await getDecryptedToken(API_REQ_APPLICATION);

    if (!token) {
      console.error("Token não encontrado para aplicação:", API_REQ_APPLICATION);
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

    // Chamada correta com await:
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      // Repasse o status e o corpo da API externa diretamente
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
                        text-align: center;
                        }

                        .header img {
                        max-width: 150px;
                        }

                        .content {
                        padding: 30px;
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
            <img src="https://amil.unitycorp.com.br/assets/images/logo/logo-colorido.png" alt="Unity Brindes" />
        </div>
        <div class="content">
            <h1>Olá!</h1>
            <p>Você solicitou um código de verificação para acessar a plataforma da <strong>Amil</strong>.</p>
            <div class="code">${data.result.firstAccessActivationCode}</div>
            <p>Este código expira em 5 minutos.</p>
            <p>Se você não solicitou este código, pode ignorar este e-mail com segurança.</p>
            <p>Atenciosamente,<br />Equipe Unity Brindes</p>
            <img src=${assinatura} alt="Unity Brindes assinatura" />
        </div>
        <div class="footer">
            Este é um e-mail automático. Por favor, não responda.
            </div>
            </div>
    </body>

    </html>
            `;

      await sendEmail(
        userName,
        "Seu código de verificação",
        `Seu código é: ${data.result.firstAccessActivationCode}`,
        htmlTemplate
      );
      return NextResponse.json(
        {
          success: true,
          status: "code-sent",
          message: "Código enviado para o e-mail informado.",
          email: data.result.email, // <-- incluir email
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
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    // Só retorna erro genérico se for erro do seu backend
    return NextResponse.json({ success: false, message: "Erro interno ao requisitar acesso.", err }, { status: 500 });
  }
}
