import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import colors from "../../../../cores.json";
import { sendEmailGroup } from "@/app/services/sendEmail";
import { NOME_LOJA } from "@/app/utils/env";
import type { OrderPayload } from "@/app/types/payloadPedido";
import type { CartItemPersist } from "@/app/types/cart";
import { maskEmail, maskPhone } from "@/app/services/utils";

// Função auxiliar para formatar preço no servidor
function formatPrice(price: number | string): string {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(isNaN(numPrice) ? 0 : numPrice);
}

// Função auxiliar para construir URL completa da imagem
function getImageUrl(thumb: string | undefined): string {
  if (!thumb) return "";
  // Se já é uma URL completa (começa com http:// ou https://), retorna como está
  if (thumb.startsWith("http://") || thumb.startsWith("https://")) {
    return thumb;
  }
  // Se começa com /, adiciona a base URL
  if (thumb.startsWith("/")) {
    return `https://ubp-default.vercel.app${thumb}`;
  }
  // Caso contrário, adiciona a base URL com /
  return `https://ubp-default.vercel.app/${thumb}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { payload, products, emailConfig, orderNumber } = body;

    // Validação dos dados obrigatórios
    if (!payload || !products || !Array.isArray(products)) {
      return NextResponse.json({ success: false, message: "Payload e produtos são obrigatórios." }, { status: 400 });
    }

    const orderPayload = payload as OrderPayload;
    const cartProducts = products as CartItemPersist[];

    // Obtém o número do pedido (pode vir no body ou no payload)
    const payloadWithOrderId = payload as OrderPayload & { orderId?: string; orderNumber?: string };
    const orderId = orderNumber || payloadWithOrderId.orderId || payloadWithOrderId.orderNumber || "N/A";

    // Configuração de email (opcional, com valores padrão)
    const emailTo = emailConfig?.to || [orderPayload.emailShipping || orderPayload.email];
    const emailCc = emailConfig?.cc || [];
    const emailCco = emailConfig?.cco || [];
    const emailReplyTo = emailConfig?.replyTo;

    // Calcula totais
    const totalProducts = parseFloat(orderPayload.totalProductsAmount || "0");
    const totalShipping = parseFloat(orderPayload.totalShippingAmount || "0");
    const totalDiscount = parseFloat(orderPayload.totalDiscountAmount || "0");
    const totalOrder = parseFloat(orderPayload.orderTotalAmount || "0");

    // Gera HTML dos produtos
    const productsHtml = cartProducts
      .map((product) => {
        const personalizationsHtml =
          product.personalizations && product.personalizations.length > 0
            ? product.personalizations
                .map(
                  (p: { descricao: string; precoTotal: number }) => `
                  <div style="margin-left: 20px; margin-top: 5px; font-size: 12px; color: #666;">
                    • ${p.descricao} - ${formatPrice(p.precoTotal)}
                  </div>
                `
                )
                .join("")
            : "";

        const imageUrl = getImageUrl(product.thumb);
        const imageHtml = imageUrl
          ? `<img src="${imageUrl}" alt="${
              product.alt || product.productName
            }" style="width: 80px; height: 80px; object-fit: cover; border-radius: 6px; margin-right: 12px;" />`
          : `<div style="width: 80px; height: 80px; background-color: #f3f4f6; border-radius: 6px; margin-right: 12px; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 10px; text-align: center; padding: 4px;">Sem imagem</div>`;

        return `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px; text-align: left;">
              <div style="display: flex; align-items: flex-start;">
                ${imageHtml}
                <div style="flex: 1;">
                  <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">${product.productName}</div>
                  ${
                    product.color
                      ? `<div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Cor: ${product.color}</div>`
                      : ""
                  }
                  ${product.size ? `<div style="font-size: 12px; color: #6b7280;">Tamanho: ${product.size}</div>` : ""}
                  ${personalizationsHtml}
                </div>
              </div>
            </td>
            <td style="padding: 12px; text-align: center; color: #374151; vertical-align: top;">${product.quantity}</td>
            <td style="padding: 12px; text-align: right; color: #374151; vertical-align: top;">${formatPrice(
              product.unitPriceEffective
            )}</td>
            <td style="padding: 12px; text-align: right; font-weight: 600; color: #1f2937; vertical-align: top;">${formatPrice(
              product.subtotal
            )}</td>
          </tr>
        `;
      })
      .join("");

    // Template HTML do email de pedido aprovado
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Pedido Aprovado</title>
          <style>
            body {
              background-color: #f4f4f4;
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 800px;
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
              padding: 30px;
              color: ${colors.TemplateEmail.fontColor};
              font-size: 14px;
              line-height: 1.6;
            }
            .content h1 {
              color: ${colors.TemplateEmail.codeColor};
              margin-top: 0;
            }
            .content h2 {
              color: ${colors.TemplateEmail.codeColor};
              font-size: 18px;
              margin-top: 30px;
              margin-bottom: 15px;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 10px;
            }
            .success-banner {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 25px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: center;
            }
            .success-banner h2 {
              margin: 0;
              font-size: 24px;
              color: white;
              border: none;
              padding: 0;
            }
            .success-icon {
              font-size: 48px;
              margin-bottom: 10px;
            }
            .info-section {
              background-color: #f9fafb;
              padding: 20px;
              border-radius: 6px;
              margin: 20px 0;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              font-weight: 600;
              color: #374151;
            }
            .info-value {
              color: #6b7280;
            }
            .products-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .products-table th {
              background-color: #f3f4f6;
              padding: 12px;
              text-align: left;
              font-weight: 600;
              color: #374151;
              border-bottom: 2px solid #e5e7eb;
            }
            .products-table th:first-child {
              width: 50%;
            }
            .products-table td {
              padding: 12px;
              vertical-align: top;
            }
            .total-section {
              background-color: #f0f9ff;
              padding: 20px;
              border-radius: 6px;
              margin-top: 20px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              font-size: 14px;
            }
            .total-row.final {
              font-size: 18px;
              font-weight: 700;
              color: ${colors.TemplateEmail.codeColor};
              border-top: 2px solid #e5e7eb;
              margin-top: 10px;
              padding-top: 15px;
            }
            .status-badge {
              display: inline-block;
              padding: 8px 16px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 600;
              margin-top: 10px;
            }
            .status-approved {
              background-color: #d1fae5;
              color: #065f46;
            }
            .footer {
              background-color: ${colors.TemplateEmail.footerColor};
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
              <img src="https://www2.unitycorp.com.br/teste/logo-header.png" alt="logo ${NOME_LOJA}" />
            </div>
            <div class="content">
              <div class="success-banner">
                <div class="success-icon">✓</div>
                <h2>Pedido Aprovado!</h2>
                <p style="margin: 10px 0 0 0; font-size: 16px;">Seu pedido #${orderId} foi aprovado com sucesso!</p>
              </div>

              <p>Olá, <strong>${orderPayload.contactNameShipping || orderPayload.legalName || "Cliente"}</strong>!</p>
              <p>
                Temos o prazer de informar que seu pedido na <strong>${NOME_LOJA}</strong> foi <strong>aprovado</strong> e está em processo de preparação.
              </p>

              <div class="info-section" style="margin-top: 20px; margin-bottom: 20px; background-color: #ecfdf5; border: 2px solid #10b981;">
                <div class="info-row" style="border-bottom: none;">
                  <span class="info-label" style="font-size: 16px; font-weight: 700;">Número do Pedido:</span>
                  <span class="info-value" style="font-size: 16px; font-weight: 700; color: #059669;">#${orderId}</span>
                </div>
              </div>

              <div class="status-badge status-approved">
                Status: Aprovado ✓
              </div>

              <h2>Dados do Pedido</h2>
              <div class="info-section">
                <div class="info-row">
                  <span class="info-label">Nome:</span>
                  <span class="info-value">${orderPayload.contactNameShipping || orderPayload.legalName || "-"}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">E-mail:</span>
                  <span class="info-value">${maskEmail(orderPayload.emailShipping || orderPayload.email) || "-"}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Telefone:</span>
                  <span class="info-value">${
                    maskPhone(
                      orderPayload.phoneShipping || orderPayload.phone,
                      orderPayload.areaCodeShipping || orderPayload.areaCode
                    ) || "-"
                  }</span>
                </div>
              </div>

              <h2>Endereço de Entrega</h2>
              <div class="info-section">
                <div class="info-row">
                  <span class="info-label">Nome:</span>
                  <span class="info-value">${orderPayload.contactNameShipping || "-"}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Endereço:</span>
                  <span class="info-value">
                    ${orderPayload.streetNameShipping || ""} ${orderPayload.streetNumberShipping || ""}
                    ${orderPayload.addressLine2Shipping ? `- ${orderPayload.addressLine2Shipping}` : ""}
                  </span>
                </div>
                <div class="info-row">
                  <span class="info-label">Bairro:</span>
                  <span class="info-value">${orderPayload.addressNeighborhoodShipping || "-"}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Cidade/UF:</span>
                  <span class="info-value">${orderPayload.addressCityShipping || "-"} / ${
      orderPayload.addressStateCodeShipping || "-"
    }</span>
                </div>
                <div class="info-row">
                  <span class="info-label">CEP:</span>
                  <span class="info-value">${orderPayload.zipCodeShipping || "-"}</span>
                </div>
              </div>

              <h2>Produtos do Pedido</h2>
              <table class="products-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th style="text-align: center;">Qtd</th>
                    <th style="text-align: right;">Unitário</th>
                    <th style="text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${productsHtml}
                </tbody>
              </table>

              <h2>Resumo Financeiro</h2>
              <div class="total-section">
                <div class="total-row">
                  <span>Subtotal dos Produtos:</span>
                  <span>${formatPrice(totalProducts)}</span>
                </div>
                ${
                  totalDiscount > 0
                    ? `<div class="total-row"><span>Desconto:</span><span>${formatPrice(totalDiscount)}</span></div>`
                    : ""
                }
                <div class="total-row">
                  <span>Frete:</span>
                  <span>${formatPrice(totalShipping)}</span>
                </div>
                <div class="total-row final">
                  <span>Total do Pedido:</span>
                  <span>${formatPrice(totalOrder)}</span>
                </div>
              </div>

              <h2>Informações de Pagamento</h2>
              <div class="info-section">
                <div class="info-row">
                  <span class="info-label">Método de Pagamento:</span>
                  <span class="info-value">${orderPayload.paymentMethod || "-"}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Número de Parcelas:</span>
                  <span class="info-value">${orderPayload.numberOfInstallments || "1"}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Status do Pagamento:</span>
                  <span class="info-value">${orderPayload.paymentStatus || "-"}</span>
                </div>
              </div>

              <div style="background-color: #f0f9ff; padding: 20px; border-radius: 6px; margin-top: 30px; border-left: 4px solid #3b82f6;">
                <p style="margin: 0; font-weight: 600; color: #1e40af;">
                  📦 Próximos Passos:
                </p>
                <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #1e3a8a;">
                  <li>Seu pedido será enviado para produção</li>
                  <li>Você receberá atualizações sobre o status do pedido</li>
                  <li>O prazo previsto para entrega é de 15 dias uteis após aprovação do layout</li>
                </ul>
              </div>

              <p style="margin-top: 30px;">
                Agradecemos sua confiança em nossos produtos e serviços!
              </p>
              <p>Atenciosamente,<br />Equipe ${NOME_LOJA}</p>
              <img src="https://www2.unitycorp.com.br/teste/rodape-email.png" alt="assinatura e-mail ${NOME_LOJA}" style="max-width: 100%; margin-top: 20px;" />
            </div>
            <div class="footer">
              Este é um e-mail automático. Por favor, não responda.
            </div>
          </div>
        </body>
      </html>
    `;

    // Texto alternativo (versão texto simples)
    const textVersion = `
Pedido Aprovado #${orderId} - ${NOME_LOJA}

Olá, ${orderPayload.contactNameShipping || orderPayload.legalName || "Cliente"}!

Temos o prazer de informar que seu pedido foi APROVADO e está em processo de preparação.

Número do Pedido: #${orderId}
Status: Aprovado ✓

DADOS DO PEDIDO:
Nome: ${orderPayload.contactNameShipping || orderPayload.legalName || "-"}
E-mail: ${maskEmail(orderPayload.emailShipping || orderPayload.email) || "-"}
Telefone: ${
      maskPhone(
        orderPayload.phoneShipping || orderPayload.phone,
        orderPayload.areaCodeShipping || orderPayload.areaCode
      ) || "-"
    }

ENDEREÇO DE ENTREGA:
${orderPayload.contactNameShipping || "-"}
${orderPayload.streetNameShipping || ""} ${orderPayload.streetNumberShipping || ""}
${orderPayload.addressNeighborhoodShipping || "-"}
${orderPayload.addressCityShipping || "-"} / ${orderPayload.addressStateCodeShipping || "-"}
CEP: ${orderPayload.zipCodeShipping || "-"}

PRODUTOS:
${cartProducts
  .map(
    (p) =>
      `- ${p.productName} (${p.codPro}) - Qtd: ${p.quantity} - Unit: ${formatPrice(
        p.unitPriceEffective
      )} - Total: ${formatPrice(p.subtotal)}`
  )
  .join("\n")}

RESUMO FINANCEIRO:
Subtotal: ${formatPrice(totalProducts)}
Frete: ${formatPrice(totalShipping)}
Total: ${formatPrice(totalOrder)}

Método de Pagamento: ${orderPayload.paymentMethod || "-"}

PRÓXIMOS PASSOS:
- Produção da amostra virtual
- Previsão de prazo de entrega, 15 dias após aprovação da amostra virtual
- Você receberá atualizações sobre o status do pedido

Agradecemos sua confiança em nossos produtos e serviços!
    `.trim();

    // Envia o email
    await sendEmailGroup(
      Array.isArray(emailTo) ? emailTo : [emailTo],
      Array.isArray(emailCc) ? emailCc : emailCc || [],
      Array.isArray(emailCco) ? emailCco : emailCco || [],
      `Pedido Aprovado #${orderId} - ${NOME_LOJA}`,
      textVersion,
      htmlTemplate,
      emailReplyTo
    );

    return NextResponse.json(
      {
        success: true,
        message: "E-mail de pedido aprovado enviado com sucesso.",
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Erro interno ao enviar e-mail de pedido aprovado:", err.message);
      return NextResponse.json(
        { success: false, message: "Erro interno ao enviar e-mail", details: err.message },
        { status: 500 }
      );
    } else {
      console.error("Erro interno desconhecido ao enviar e-mail:", err);
      return NextResponse.json(
        { success: false, message: "Erro interno desconhecido ao enviar e-mail" },
        { status: 500 }
      );
    }
  }
}
