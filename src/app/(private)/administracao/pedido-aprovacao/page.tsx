"use client";
import { useState } from "react";
import { TitleSection } from "@/app/components/TitleSection";
import { OrderDetailsModal } from "@/app/components/OrderDetailsModal";
import type { OrderDetails } from "@/app/types/order";
import { exportExcelFile } from "@/app/services/gerarPlanilha";
import { formatPrice } from "@/app/utils/formatter";
import { Search, SquareCheckBig, TableProperties } from "lucide-react";
// import { useForm } from "react-hook-form";

// Tipos movidos para src/app/types/order.ts

export default function EstoqueConsulta() {
  // const { register, watch } = useForm();
  // const categoria = watch("categoria");
  // const data = watch("data");

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
    <div className="min-h-[calc(100dvh-114px)] w-full max-w-[96vw] mx-auto flex flex-col lg:flex-row bg-white pt-14 p-4 mt-10">
      <div className="w-full max-w-[96vw] flex flex-col bg-white mx-auto p-4 rounded-2xl">
        <TitleSection text="Pedido | Aprovação" icon={<SquareCheckBig size={28} className="text-green-600" />} />

        {/* 🔍 FILTROS */}
        <div className="pt-8 pb-4">
          <form method="POST">
            <div className="w-full flex flex-col md:flex-row flex-wrap md:flex-nowrap gap-2 md:gap-4 items-end">
              <div className="flex flex-row flex-wrap md:flex-nowrap gap-2 justify-start w-full md:w-full items-end">
                {/* SITUAÇÃO */}
                <div className="w-full md:w-52 text-xs md:text-sm lg:text-xs">
                  <label className="text-xs 2xl:text-sm font-medium text-gray-700 flex gap-2" htmlFor="situacao">
                    Situação:
                  </label>
                  <select
                    id="situacao"
                    name="situacao"
                    className="w-full mx-auto h-8 md:h-9 px-1 md:px-4 text-xs py-1 md:py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todas</option>
                    <option value="Aguardando Aprovação">Aguardando Aprovação</option>
                    <option value="Aprovados">Aprovados</option>
                  </select>
                </div>
                {/* PEDIDO */}
                <div className="w-full md:w-40 text-xs md:text-sm lg:text-base">
                  <label className="text-xs 2xl:text-sm font-medium text-gray-700 flex gap-2" htmlFor="pedido">
                    Pedido:
                  </label>
                  <input
                    type="text"
                    id="pedido"
                    className="w-full mx-auto px-1 text-xs py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {/* DATA INICIO */}
                <div className="w-full md:w-40 text-xs md:text-sm lg:text-base">
                  <label className="text-xs 2xl:text-sm font-medium text-gray-700 flex gap-2" htmlFor="dataInicio">
                    Data Início:
                  </label>
                  <input
                    type="date"
                    id="dataInicio"
                    className="w-full mx-auto px-1 text-xs py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {/* DATA FINAL */}
                <div className="w-full md:w-40 text-xs md:text-sm lg:text-base">
                  <label className="text-xs 2xl:text-sm font-medium text-gray-700 flex gap-2" htmlFor="dataFinal">
                    Data final:
                  </label>
                  <input
                    type="date"
                    id="dataFinal"
                    className="w-full mx-auto px-1 text-xs py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* BOTÕES */}
              <div className="flex gap-2 justify-start w-full md:w-fit mt-2 md:mt-0 md:ml-auto md:flex-nowrap items-end">
                <button className="inline-flex items-center h-8 md:h-9 px-4 md:px-8 text-xs md:text-sm lg:text-base text-Button-text bg-Button-bg rounded-md cursor-pointer hover:bg-secondary">
                  Filtrar
                </button>
                <button className="inline-flex items-center h-8 md:h-9 px-4 md:px-6 text-xs md:text-sm lg:text-base text-Button-text bg-gray-700 rounded-md cursor-pointer hover:bg-secondary">
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
                {Array.from({ length: 10 }).map((_, i) => (
                  <tr
                    key={i}
                    className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-300"
                  >
                    {/* 🔹 Coluna fixa */}
                    <td className="sticky text-center bg-white z-5 px-3 py-2 border border-gray-300 whitespace-nowrap">
                      001399
                    </td>
                    <td className="px-3 py-2 border border-gray-300">Nome do comprador</td>
                    <td className="px-3 py-2 border border-gray-300">Centro De Idiomas Gobbi Ltda - Me</td>
                    <td className="px-3 py-2 border border-gray-300 whitespace-nowrap">{formatPrice(507.85)}</td>
                    <td className="px-3 py-2 border border-gray-300 whitespace-nowrap">{formatPrice(36.13)}</td>
                    <td className="px-3 py-2 border border-gray-300 text-right">{formatPrice(0.0)}</td>
                    <td className="px-3 py-2 border border-gray-300 text-right">{formatPrice(543.98)}</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">21-10-2025</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">10-11-2025</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">
                      <Search
                        className="mx-auto cursor-pointer hover:text-primary"
                        onClick={() =>
                          openOrderModal({
                            numero: "001399",
                            status: "Pendente",
                            solicitante: {
                              fullName: "Nome do comprador",
                              email: "comprador@example.com",
                              phone: "(11) 99999-9999",
                              key: "USER123",
                              document: "123.456.789-00",
                            },
                            faturarPara: {
                              companyName: "Centro De Idiomas Gobbi Ltda - Me",
                              cnpj: "12.345.678/0001-90",
                              stateRegistration: "123.456.789.000",
                              municipalRegistration: "987654",
                              taxRegime: "Simples Nacional",
                              address: {
                                street: "Rua Exemplo",
                                number: "123",
                                complement: "Sala 2",
                                neighborhood: "Centro",
                                city: "São Paulo",
                                state: "SP",
                                zipCode: "01000-000",
                              },
                            },
                            entrega: {
                              recipientName: "Centro De Idiomas Gobbi Ltda - Me",
                              contactName: "Fulano de Tal",
                              contactPhone: "(11) 88888-8888",
                              method: "SEDEX",
                              trackingCode: "BR123456789BR",
                              address: {
                                street: "Av. Entrega",
                                number: "500",
                                complement: "Galpão B",
                                neighborhood: "Bairro Industrial",
                                city: "São Paulo",
                                state: "SP",
                                zipCode: "02000-000",
                              },
                            },
                            pagamento: {
                              method: "Boleto",
                              totalAmount: 543.98,
                              installments: 3,
                              interestRate: 1.2,
                              interestAmount: 6.53,
                              status: "Aprovado",
                            },
                            produtos: [
                              {
                                code: "PROD-001",
                                name: "Caneca personalizada",
                                imageUrl: "/images/produtos/caneca.png",
                                unitPrice: 20.0,
                                quantity: 10,
                                total: 200.0,
                              },
                              {
                                code: "PROD-002",
                                name: "Camiseta Branca",
                                imageUrl: "/images/produtos/camiseta.png",
                                unitPrice: 50.0,
                                quantity: 3,
                                total: 150.0,
                              },
                            ],
                            totais: {
                              produtos: 507.85,
                              frete: 36.13,
                              juros: 0.0,
                              pedido: 543.98,
                            },
                            compra: "21-10-2025",
                            previsaoEntrega: "10-11-2025",
                          })
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {isModalOpen && orderDetails && (
        <OrderDetailsModal isOpen={isModalOpen} onClose={closeOrderModal} order={orderDetails} />
      )}
    </div>
  );
}
