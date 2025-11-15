"use client";
import { type MouseEvent } from "react";
import { formatCpfCnpj, formatDateTime, formatPhoneBR, formatPrice } from "@/app/utils/formatter";
import type { OrderDetails } from "@/app/types/order";
import { formatCep } from "../services/utils";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  order: OrderDetails;
};

export function OrderDetailsModal({ isOpen, onClose, order }: Props) {
  if (!isOpen) return null;

  const {
    orderId,
    orderStatus,
    buyer,
    billing,
    delivery,
    payment,
    products,
    totalProductsAmount,
    totalShippingAmount,
    totalInterestAmount,
    totalDiscountAmount,
    orderTotalAmount,
    // purchaseDate,
    expectedDeliveryDate,
    // deliveredDate,
    // paymentDate,
    createdAt,
    updatedAt,
  } = order;
  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const statusBadgeClasses = (s?: string) => {
    const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
    if (!s) return `${base} bg-gray-100 text-gray-700`;
    const norm = s.toLowerCase();
    if (norm.includes("aprovado")) return `${base} bg-green-100 text-green-700`;
    if (norm.includes("aguardando")) return `${base} bg-red-100 text-red-700`;
    if (norm.includes("pend")) return `${base} bg-yellow-100 text-yellow-700`;
    if (norm.includes("cancel")) return `${base} bg-red-100 text-red-700`;
    return `${base} bg-gray-100 text-gray-700`;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-[95vw] md:max-w-[990px] max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
          <div>
            <h2 className="text-base md:text-lg font-semibold">Detalhes do Pedido #{orderId}</h2>
          </div>
          <button
            type="button"
            className="text-sm md:text-base text-gray-600 hover:text-gray-900 cursor-pointer"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>

        <div className="flex-1 p-4 space-y-6 text-sm overflow-y-auto scrollbar">
          {/* Cards em grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Solicitanmte */}
            <section className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="text-sm md:text-base font-semibold text-blue-600 mb-2">Solicitante</h3>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <span className="font-medium text-gray-700">Nome:</span>
                  <span className="ml-2">{buyer.legalName}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <span className="ml-2">{buyer.email}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Telefone:</span>
                  <span className="ml-2">
                    ({buyer.areaCode}) {formatPhoneBR(buyer.phone)}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Documento:</span>
                  <span className="ml-2">{formatCpfCnpj(buyer.cpfCnpj) || "-"}</span>
                </div>
              </div>
            </section>
            {/* Dados principais */}
            <section className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="text-sm md:text-base font-semibold text-blue-600 mb-2">Dados principais</h3>
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-gray-700">Criado em:</span>
                  <span className="ml-2">{formatDateTime(createdAt || "-")}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Atualizado em:</span>
                  <span className="ml-2">{formatDateTime(updatedAt || "-")}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Entrega prevista:</span>
                  <span className="ml-2">{formatDateTime(expectedDeliveryDate || "-")}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Valor Total:</span>
                  <span className="ml-2">{formatPrice(orderTotalAmount || 0)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className={`${statusBadgeClasses(orderStatus)} capitalize`}>{orderStatus || "-"}</span>
                </div>
              </div>
            </section>

            {/* Valores */}
            <section className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="text-sm md:text-base font-semibold text-blue-600 mb-2">Valores</h3>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <span className="font-medium text-gray-700">Total Produtos:</span>
                  <span className="ml-2">{formatPrice(totalProductsAmount || 0)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Total Frete:</span>
                  <span className="ml-2">{formatPrice(totalShippingAmount || 0)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Total Desconto:</span>
                  <span className="ml-2">{formatPrice(totalDiscountAmount || 0)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Total Juros:</span>
                  <span className="ml-2">{formatPrice(totalInterestAmount || 0)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Valor Total:</span>
                  <span className="ml-2">{formatPrice(orderTotalAmount || 0)}</span>
                </div>
              </div>
            </section>

            {/* Entrega */}
            <section className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="text-sm md:text-base font-semibold text-blue-600 mb-2">Entrega</h3>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <span className="font-medium text-gray-700">Contato Nome:</span>
                  <span className="ml-2">
                    {delivery.contactName || "-"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Contato Telefone:</span>
                  <span className="ml-2">
                    ({delivery.contactPhoneAreaCode}) {formatPhoneBR(delivery.contactPhone)}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Contato e-mail:</span>
                  <span className="ml-2">
                    {delivery.contactEmail || "-"}
                  </span>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Razão Social:</span>
                  <span className="ml-2">
                    {delivery.legalName}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Documento:</span>
                  <span className="ml-2">
                    {formatCpfCnpj(delivery.cpfCnpf) || "-"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Endereço:</span>
                  <span className="ml-2">
                    {delivery.address.name}, {delivery.address.number}
                    {delivery.address.line2 ? `, ${delivery.address.line2}` : ""}, {delivery.address.neighborhood},{" "}
                    {delivery.address.city}, {delivery.address.stateCode} - {formatCep(delivery.address.zipCode)}
                  </span>
                </div>
                {delivery.method && (
                  <div>
                    <span className="font-medium text-gray-700">Método:</span>
                    <span className="ml-2">{delivery.method}</span>
                  </div>
                )}
                {delivery.trackingCode && (
                  <div>
                    <span className="font-medium text-gray-700">Rastreio:</span>
                    <span className="ml-2">{delivery.trackingCode}</span>
                  </div>
                )}
              </div>
            </section>

            {/* Faturamento */}
            <section className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="text-sm md:text-base font-semibold text-blue-600 mb-2">Faturamento</h3>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <span className="font-medium text-gray-700">Contato Nome:</span>
                  <span className="ml-2">
                    {billing.contactName || "-"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Contato Telefone:</span>
                  <span className="ml-2">
                    ({billing.contactPhoneAreaCode}) {formatPhoneBR(billing.contactPhone)}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Contato e-mail:</span>
                  <span className="ml-2">
                    {billing.contactEmail || "-"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Razão Social:</span>
                  <span className="ml-2">
                    {billing.legalName}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Documento:</span>
                  <span className="ml-2">
                    {formatCpfCnpj(billing.cpfCnpj) || "-"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Endereço:</span>
                  <span className="ml-2">
                    {billing.address.name}, {billing.address.number}
                    {billing.address.line2 ? `, ${billing.address.line2}` : ""}, {billing.address.neighborhood},{" "}
                    {billing.address.city}, {billing.address.stateCode} - {formatCep(billing.address.zipCode)}
                  </span>
                </div>
              </div>
            </section>

            {/* Pagamento */}
            <section className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="text-sm md:text-base font-semibold text-blue-600 mb-2">Pagamento</h3>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <span className="font-medium text-gray-700">Método:</span>
                  <span className="ml-2">{payment.method}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Data vencimento:</span>
                  <span className="ml-2">{payment.expirationDate || "-"}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Data pagamento:</span>
                  <span className="ml-2">{payment.paymentDate || "-"}</span>
                </div>
                {payment.installments && (
                  <div>
                    <span className="font-medium text-gray-700">Parcelas:</span>
                    <span className="ml-2">
                      {payment.installments}x de {formatPrice(payment.totalAmount / payment.installments)}
                    </span>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className={statusBadgeClasses(payment.status)}>{payment.status || "-"}</span>
                </div>
              </div>
            </section>
          </div>

          {/* Itens do Pedido */}
          <section>
            <h3 className="text-sm md:text-base font-semibold text-blue-600 mb-2">Itens do Pedido</h3>
            <div className="space-y-3">
              {products.map((p, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-3 flex items-start justify-between"
                >
                  <div className="flex items-start gap-3">
                    {p.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt={p.name || p.code} className="w-20 h-20 object-cover rounded" />
                    )}
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-800"><span className="font-medium text-gray-700">Produto:</span> {p.descrPro || "-"}</p>
                      <p className="text-xs font-semibold text-gray-800"><span className="font-medium text-gray-700">Cor:</span> {p.descrProCor || "-"}</p>
                      <p className="text-xs font-semibold text-gray-800"><span className="font-medium text-gray-700">Tamanho:</span> {p.descrProTam || "-"}</p>
                      {/** adicionar personalizações */}
                      {p.personals.map((personal) => (
                        <p key={personal.orderProductPersonalId} className="text-xs font-semibold text-gray-800">
                          <span className="font-medium text-gray-700">Serviço:</span> {personal.descrWebPersonal}
                        </p>
                      ))}
                      <p className="text-xs font-semibold text-gray-800"><span className="font-medium text-gray-700">Qtd:</span> {p.quantity}</p>
                      <p className="text-xs text-gray-500"><span className="font-extralight text-gray-700">Código:</span> {p.code}</p>

                    </div>

                  </div>
                  <div className="text-right">
                    <p className="text-sm md:text-base font-semibold text-gray-900"><span className="font-medium text-gray-700">Total:</span> {formatPrice(p.total)}</p>
                    <p className="text-xs text-gray-500"><span className="font-medium text-gray-700">Unitário:</span> {formatPrice(p.unitPrice)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
