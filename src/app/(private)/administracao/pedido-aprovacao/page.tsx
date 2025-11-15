"use client";
import { TitleSection } from "@/app/components/TitleSection";
import { OrderDetailsModal } from "@/app/components/OrderDetailsModal";
import type { OrderDetails } from "@/app/types/order";
import { exportExcelFile } from "@/app/services/gerarPlanilha";
import { formatPrice } from "@/app/utils/formatter";
import { Search, SquareCheckBig, TableProperties } from "lucide-react";
// import { useForm } from "react-hook-form";
import { OrdersProvider, useOrders } from "@/app/Context/OrderContext";
import { useState } from "react";

// Tipos movidos para src/app/types/order.ts

function TableRows({ onOpen }: { onOpen: (details: OrderDetails) => void }) {
  const { orders, loading, error } = useOrders();
  if (loading) {
    return (
      <tr>
        <td colSpan={10} className="px-3 py-4 text-center text-gray-500">
          Carregando pedidos...
        </td>
      </tr>
    );
  }
  if (error) {
    return (
      <tr>
        <td colSpan={10} className="px-3 py-4 text-center text-red-600">
          {error}
        </td>
      </tr>
    );
  }
  if (!orders || orders.length === 0) {
    return (
      <tr>
        <td colSpan={10} className="px-3 py-4 text-center text-gray-500">
          Nenhum pedido encontrado
        </td>
      </tr>
    );
  }
  return (
    <>
      {orders.map((o) => (
        <tr
          key={o.orderId}
          className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-300"
        >
          {/* 🔹 Coluna fixa */}
          <td className="sticky text-center bg-white z-5 px-3 py-2 border border-gray-300 whitespace-nowrap">
            {o.orderId}
          </td>
          <td className="px-3 py-2 border border-gray-300">{o.buyer?.legalName || "-"}</td>
          <td className="px-3 py-2 border border-gray-300">{o.billing?.legalName || "-"}</td>
          <td className="px-3 py-2 border border-gray-300 whitespace-nowrap">
            {formatPrice(o.totalProductsAmount || 0)}
          </td>
          <td className="px-3 py-2 border border-gray-300 whitespace-nowrap">
            {formatPrice(o.totalShippingAmount || 0)}
          </td>
          <td className="px-3 py-2 border border-gray-300 text-right">{formatPrice(o.totalInterestAmount || 0)}</td>
          <td className="px-3 py-2 border border-gray-300 text-right">{formatPrice(o.orderTotalAmount || 0)}</td>
          <td className="px-3 py-2 border border-gray-300 text-center">{o.purchaseDate || "-"}</td>
          <td className="px-3 py-2 border border-gray-300 text-center">
            {o.expectedDeliveryDate || o.deliveredDate || "-"}
          </td>
          <td className="px-3 py-2 border border-gray-300 text-center">
            <Search className="mx-auto cursor-pointer hover:text-primary" onClick={() => onOpen(o)} />
          </td>
        </tr>
      ))}
    </>
  );
}

function FilterBar() {
  const { refresh } = useOrders();
  const [situacao, setSituacao] = useState<string>("Aguardando Aprovação");
  const [pedido, setPedido] = useState<string>("");
  const [solicitante, setSolicitante] = useState<string>("");
  const [faturamento, setFaturamento] = useState<string>("");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFinal, setDataFinal] = useState<string>("");

  const onFiltrar = () => {
    // Monta params e remove valores vazios/nulos antes de enviar
    const params = {
      orderStatus: situacao,
      context: "pedido-aprovacao",
      orderId: pedido,
      legalName: solicitante,
      legalNameBilling: faturamento,
      createdAt: dataInicio,
      createdAtEnd: dataFinal,
    } as Record<string, string>;

    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "")
    );

    refresh(cleanParams);
  };

  const onReset = () => {
    setSituacao("Aguardando Aprovação");
    setPedido("");
    setSolicitante("");
    setFaturamento("");
    setDataInicio("");
    setDataFinal("");
    refresh({ orderStatus: "Aguardando Aprovação", context: "pedido-aprovacao" });
  };

  return (
    <div className="pt-8 pb-4">
      <form method="POST" onSubmit={(e) => e.preventDefault()}>
        <div className="w-full flex flex-col md:flex-row flex-wrap md:flex-nowrap gap-2 md:gap-4 items-end">
          <div className="flex flex-row flex-wrap md:flex-nowrap gap-2 justify-start w-full md:w-full items-end">
            <div className="w-full md:w-52 text-xs md:text-sm lg:text-xs">
              <label className="text-xs 2xl:text-sm font-medium text-gray-700 flex gap-2" htmlFor="situacao">
                Situação Aprovação:
              </label>
              <select
                id="situacao"
                name="situacao"
                value={situacao}
                onChange={(e) => setSituacao(e.target.value)}
                className="w-full mx-auto h-8 md:h-9 px-1 md:px-4 text-xs py-1 md:py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Aguardando Aprovação">Aguardando Aprovação</option>
                <option value="Aprovado">Aprovado</option>
                <option value="Rejeitado">Rejeitado</option>
              </select>
            </div>
            <div className="w-full md:w-40 text-xs md:text-sm lg:text-base">
              <label className="text-xs 2xl:text-sm font-medium text-gray-700 flex gap-2" htmlFor="pedido">
                Pedido:
              </label>
              <input
                type="text"
                id="pedido"
                value={pedido}
                onChange={(e) => setPedido(e.target.value)}
                className="w-full mx-auto px-1 text-xs py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="w-full md:w-70 text-xs md:text-sm lg:text-base">
              <label className="text-xs 2xl:text-sm font-medium text-gray-700 flex gap-2" htmlFor="solicitante">
                Solicitante:
              </label>
              <input
                type="text"
                id="solicitante"
                value={solicitante}
                onChange={(e) => setSolicitante(e.target.value)}
                className="w-full mx-auto px-1 text-xs py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="w-full md:w-70 text-xs md:text-sm lg:text-base">
              <label className="text-xs 2xl:text-sm font-medium text-gray-700 flex gap-2" htmlFor="faturamento">
                Faturamento:
              </label>
              <input
                type="text"
                id="faturamento"
                value={faturamento}
                onChange={(e) => setFaturamento(e.target.value)}
                className="w-full mx-auto px-1 text-xs py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="w-full md:w-40 text-xs md:text-sm lg:text-base">
              <label className="text-xs 2xl:text-sm font-medium text-gray-700 flex gap-2" htmlFor="dataInicio">
                Data Início:
              </label>
              <input
                type="date"
                id="dataInicio"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full mx-auto px-1 text-xs py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="w-full md:w-40 text-xs md:text-sm lg:text-base">
              <label className="text-xs 2xl:text-sm font-medium text-gray-700 flex gap-2" htmlFor="dataFinal">
                Data final:
              </label>
              <input
                type="date"
                id="dataFinal"
                value={dataFinal}
                onChange={(e) => setDataFinal(e.target.value)}
                className="w-full mx-auto px-1 text-xs py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-start w-full md:w-fit mt-2 md:mt-0 md:ml-auto md:flex-nowrap items-end">
            <button
              type="button"
              onClick={onFiltrar}
              className="inline-flex items-center h-8 md:h-9 px-4 md:px-8 text-xs md:text-sm lg:text-base text-Button-text bg-Button-bg rounded-md cursor-pointer hover:bg-secondary"
            >
              Filtrar
            </button>
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center h-8 md:h-9 px-4 md:px-6 text-xs md:text-sm lg:text-base text-Button-text bg-gray-700 rounded-md cursor-pointer hover:bg-secondary"
            >
              Redefinir
            </button>
            <button
              type="button"
              title="Gerar Planilha"
              onClick={() =>
                exportExcelFile({
                  tableId: "tabela-estoque",
                  filename: "estoque-atual.xlsx",
                })
              }
              className="inline-flex items-center h-8 md:h-9 px-4 md:px-6 text-xs md:text-sm lg:text-base gap-2 text-Button-text bg-green-500 rounded-md cursor-pointer hover:bg-green-700"
            >
              <TableProperties className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function PedidoAprovacao() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

  const openOrderModal = (details: OrderDetails) => {
    setOrderDetails(details);
    setIsModalOpen(true);
  };

  const closeOrderModal = () => {
    setIsModalOpen(false);
    setOrderDetails(null);
  };

  return (
    <OrdersProvider autoFetch initialParams={{ orderStatus: "Aguardando Aprovação", context: "pedido-aprovacao" }}>
      <div className="min-h-[calc(100dvh-114px)] w-full max-w-[96vw] mx-auto flex flex-col lg:flex-row bg-white pt-14 p-4 mt-10">
        <div className="w-full max-w-[96vw] flex flex-col bg-white mx-auto p-4 rounded-2xl">
          <TitleSection text="Pedido | Aprovação" icon={<SquareCheckBig size={28} className="text-green-600" />} />
          {/* 🔍 FILTROS */}
          <FilterBar />

          {/* 📋 TABELA RESPONSIVA */}
          <div className="w-full h-full min-h-[600px]">
            {/* o overflow-x-auto precisa estar no mesmo nível do table */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
              <table id="tabela-estoque" className="min-w-full text-xs md:text-sm text-gray-700 border-collapse">
                <thead className="bg-gray-100 sticky top-0 z-20">
                  <tr>
                    {/* Primeira coluna fixa */}
                    <th className="sticky left-0 z-30 bg-gray-100 px-3 py-2 text-left border border-gray-300 whitespace-nowrap">
                      N. Pedido
                    </th>
                    <th
                      className="px-3 py-2 text-left border border-gray-300 whitespace-nowrap"
                      title="Nome do usuário que criou o pedido"
                    >
                      Solicitante
                    </th>
                    <th
                      className="px-3 py-2 text-left border border-gray-300 whitespace-nowrap"
                      title="Nome da empresa para quem o pedido será faturado"
                    >
                      Faturamento
                    </th>
                    <th
                      className="px-3 py-2 text-left border border-gray-300 whitespace-nowrap"
                      title="Valor total dos produtos no pedido"
                    >
                      Total Produtos
                    </th>
                    <th
                      className="px-3 py-2 text-left border border-gray-300 whitespace-nowrap"
                      title="Valor total do frete no pedido"
                    >
                      Total Frete
                    </th>
                    <th
                      className="px-3 py-2 text-left border border-gray-300 whitespace-nowrap"
                      title="Valor total dos juros no pedido"
                    >
                      Total Juros
                    </th>
                    <th
                      className="px-3 py-2 text-left border border-gray-300 whitespace-nowrap"
                      title="Valor total do pedido, incluindo produtos, frete e juros"
                    >
                      Total Pedido
                    </th>
                    <th
                      className="px-3 py-2 text-left border border-gray-300 whitespace-nowrap"
                      title="Data de compra do pedido"
                    >
                      Compra
                    </th>
                    <th
                      className="px-3 py-2 text-left border border-gray-300 whitespace-nowrap"
                      title="Data de entrega prevista do pedido"
                    >
                      Entrega
                    </th>
                    <th className="px-3 py-2 text-left border border-gray-300 whitespace-nowrap">Detalhes</th>
                  </tr>
                </thead>

                <tbody>
                  <TableRows onOpen={openOrderModal} />
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {isModalOpen && orderDetails && (
          <OrderDetailsModal isOpen={isModalOpen} onClose={closeOrderModal} order={orderDetails} />
        )}
      </div>
    </OrdersProvider>
  );
}
