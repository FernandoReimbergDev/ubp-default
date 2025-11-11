"use client";
import { formatPrice } from "@/app/utils/formatter";
import type { OrderDetails } from "@/app/types/order";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  order: OrderDetails;
};

export function OrderDetailsModal({ isOpen, onClose, order }: Props) {
  if (!isOpen) return null;

  const { numero, status, solicitante, entrega, pagamento, produtos, compra, previsaoEntrega } = order;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const statusBadgeClasses = (s?: string) => {
    const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
    if (!s) return `${base} bg-gray-100 text-gray-700`;
    const norm = s.toLowerCase();
    if (norm.includes("aprov")) return `${base} bg-green-100 text-green-700`;
    if (norm.includes("pend")) return `${base} bg-yellow-100 text-yellow-700`;
    if (norm.includes("cancel")) return `${base} bg-red-100 text-red-700`;
    return `${base} bg-gray-100 text-gray-700`;
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-[95vw] md:max-w-[990px] max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
          <div>
            <h2 className="text-base md:text-lg font-semibold">Detalhes do Pedido</h2>
            <p className="text-xs md:text-sm text-gray-500">Order #{numero}</p>
          </div>
          <button
            type="button"
            className="text-sm md:text-base text-gray-600 hover:text-gray-900"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>

        <div className="p-4 space-y-6 text-sm">
          {/* Cards em grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dados principais */}
            <section className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="text-sm md:text-base font-semibold text-blue-600 mb-2">Dados principais</h3>
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-gray-700">Data do Pedido:</span>
                  <span className="ml-2">{compra || "-"}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Previsão de Entrega:</span>
                  <span className="ml-2">{previsaoEntrega || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className={statusBadgeClasses(status)}>{status || "-"}</span>
                </div>
              </div>
            </section>

            {/* Valores */}
            <section className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="text-sm md:text-base font-semibold text-blue-600 mb-2">Valores</h3>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <span className="font-medium text-gray-700">Método:</span>
                  <span className="ml-2">{pagamento.method}</span>
                </div>
                {pagamento.installments && (
                  <div>
                    <span className="font-medium text-gray-700">Parcelas:</span>
                    <span className="ml-2">{pagamento.installments}x de {formatPrice(pagamento.totalAmount / pagamento.installments)}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className={statusBadgeClasses(pagamento.status)}>{pagamento.status || "-"}</span>
                </div>
              </div>
            </section>

            {/* Comprador */}
            <section className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="text-sm md:text-base font-semibold text-blue-600 mb-2">Comprador</h3>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <span className="font-medium text-gray-700">Nome:</span>
                  <span className="ml-2">{solicitante.fullName}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <span className="ml-2">{solicitante.email}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Telefone:</span>
                  <span className="ml-2">{solicitante.phone}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Documento:</span>
                  <span className="ml-2">{solicitante.document || "-"}</span>
                </div>
              </div>
            </section>

            {/* Entrega */}
            <section className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="text-sm md:text-base font-semibold text-blue-600 mb-2">Entrega</h3>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <span className="font-medium text-gray-700">Endereço:</span>
                  <span className="ml-2">
                    {entrega.address.street}, {entrega.address.number}
                    {entrega.address.complement ? `, ${entrega.address.complement}` : ""}, {entrega.address.neighborhood},
                    {" "}{entrega.address.city}, {entrega.address.state} - {entrega.address.zipCode}
                  </span>
                </div>
                {entrega.method && (
                  <div>
                    <span className="font-medium text-gray-700">Método:</span>
                    <span className="ml-2">{entrega.method}</span>
                  </div>
                )}
                {entrega.trackingCode && (
                  <div>
                    <span className="font-medium text-gray-700">Rastreio:</span>
                    <span className="ml-2">{entrega.trackingCode}</span>
                  </div>
                )}
              </div>
            </section>

            {/* Faturamento */}
            <section className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="text-sm md:text-base font-semibold text-blue-600 mb-2">Faturamento</h3>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <span className="font-medium text-gray-700">Endereço:</span>
                  <span className="ml-2">
                    {entrega.address.street}, {entrega.address.number}
                    {entrega.address.complement ? `, ${entrega.address.complement}` : ""}, {entrega.address.neighborhood},
                    {" "}{entrega.address.city}, {entrega.address.state} - {entrega.address.zipCode}
                  </span>
                </div>
                {entrega.method && (
                  <div>
                    <span className="font-medium text-gray-700">Método:</span>
                    <span className="ml-2">{entrega.method}</span>
                  </div>
                )}
                {entrega.trackingCode && (
                  <div>
                    <span className="font-medium text-gray-700">Rastreio:</span>
                    <span className="ml-2">{entrega.trackingCode}</span>
                  </div>
                )}
              </div>
            </section>

            {/* Pagamento */}
            <section className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="text-sm md:text-base font-semibold text-blue-600 mb-2">Pagamento</h3>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <span className="font-medium text-gray-700">Método:</span>
                  <span className="ml-2">{pagamento.method}</span>
                </div>
                {pagamento.installments && (
                  <div>
                    <span className="font-medium text-gray-700">Parcelas:</span>
                    <span className="ml-2">{pagamento.installments}x de {formatPrice(pagamento.totalAmount / pagamento.installments)}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className={statusBadgeClasses(pagamento.status)}>{pagamento.status || "-"}</span>
                </div>
              </div>
            </section>



          </div>

          {/* Itens do Pedido */}
          <section>
            <h3 className="text-sm md:text-base font-semibold text-blue-600 mb-2">Itens do Pedido</h3>
            <div className="space-y-3">
              {produtos.map((p, idx) => (
                <div key={idx} className="rounded-lg border border-gray-200 bg-white px-4 py-3 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {p.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt={p.name || p.code} className="w-10 h-10 object-cover rounded" />
                    )}
                    <div className="space-y-1">
                      <p className="text-sm md:text-base font-semibold text-gray-800">{p.name || "-"}</p>
                      <p className="text-xs text-gray-500 uppercase">{p.code}</p>
                      <p className="text-sm text-gray-700">Qtd: {p.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm md:text-base font-semibold text-gray-900">{formatPrice(p.total)}</p>
                    <p className="text-xs text-gray-500">Unitário: {formatPrice(p.unitPrice)}</p>
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