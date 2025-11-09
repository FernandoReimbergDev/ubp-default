"use client";
import { TitleSection } from "@/app/components/TitleSection";
import { exportExcelFile } from "@/app/services/gerarPlanilha";
import { formatPrice } from "@/app/utils/formatter";
import { Search, SquareCheckBig, TableProperties } from "lucide-react";
// import { useForm } from "react-hook-form";

export default function EstoqueConsulta() {
  // const { register, watch } = useForm();
  // const categoria = watch("categoria");
  // const data = watch("data");

  return (
    <div className="min-h-[calc(100dvh-114px)] w-full max-w-[96vw] mx-auto flex flex-col lg:flex-row bg-white pt-14 p-4 mt-10">
      <div className="w-full max-w-[96vw] flex flex-col bg-white mx-auto p-4 rounded-2xl">
        <TitleSection text="Pedido | Aprovação" icon={<SquareCheckBig size={28} className="text-green-600" />} />

        {/* 🔍 FILTROS */}
        <div className="pt-8 pb-4">
          <form method="POST">
            <div className="w-full flex flex-col md:flex-row flex-wrap gap-2 md:gap-4 items-end">
              <div className="grid grid-cols-2 sm:flex gap-2 justify-start w-full md:w-fit ">
                {/* SITUAÇÃO */}
                <div className="w-full max-w-46 text-xs md:text-sm lg:text-base">
                  <label className="text-xs 2xl:text-sm font-medium text-gray-700 flex gap-2" htmlFor="situacao">
                    Situação:
                  </label>
                  <select
                    id="situacao"
                    name="situacao"
                    className="w-full mx-auto h-8 md:h-10 px-2 pr-6 text-xs md:text-sm leading-5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Aguardando Aprovação">Aguardando Aprovação</option>
                    <option value="Aprovados">Aprovados</option>
                  </select>
                </div>
                {/* PRODUTO */}
                <div className="w-full max-w-46 text-xs md:text-sm lg:text-base">
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
                <div className="w-full max-w-46 text-xs md:text-sm lg:text-base">
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
                <div className="w-full max-w-46 text-xs md:text-sm lg:text-base">
                  <label className="text-xs 2xl:text-sm font-medium text-gray-700 flex gap-2" htmlFor="dataFinal">
                    Data final:
                  </label>
                  <input
                    type="date"
                    id="dataFinal"
                    className="w-full mx-auto px-1 text-xs py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* TOTAL PEDIDO(S) */}
                <div className="w-full max-w-46 text-xs md:text-sm lg:text-base">
                  <label className="text-xs 2xl:text-sm font-medium text-gray-700 flex gap-2">
                    Total Pedido(s):
                  </label>
                  <input
                    readOnly
                    type="text"
                    id="totalPedidos"
                    className="w-full mx-auto px-1 text-xs py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* BOTÕES */}
              <div className="flex gap-2 justify-start w-full md:w-fit mt-2 md:mt-0">
                <button className="px-4 md:px-8 py-1 md:py-2 h-fit text-xs md:text-sm lg:text-base text-Button-text bg-Button-bg rounded-md cursor-pointer hover:bg-secondary">
                  Filtrar
                </button>
                <button className="px-4 md:px-6 py-1 md:py-2 h-fit text-xs md:text-sm lg:text-base text-Button-text bg-gray-700 rounded-md cursor-pointer hover:bg-secondary">
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
                  className="px-4 md:px-6 py-1 md:py-2 h-fit flex text-xs md:text-sm lg:text-base items-center gap-2 text-Button-text bg-green-500 rounded-md cursor-pointer hover:bg-green-700"
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
                    Pedido
                  </th>
                  <th className="px-3 py-2 text-left border border-gray-300 whitespace-nowrap">Cliente</th>
                  <th className="px-3 py-2 text-left border border-gray-300 whitespace-nowrap">Total Produtos</th>
                  <th className="px-3 py-2 text-right border border-gray-300 whitespace-nowrap">Total Frete</th>
                  <th className="px-3 py-2 text-right border border-gray-300 whitespace-nowrap">Total Juros</th>
                  <th className="px-3 py-2 text-right border border-gray-300 whitespace-nowrap">Total Pedido</th>
                  <th className="px-3 py-2 text-center border border-gray-300 whitespace-nowrap">Compra</th>
                  <th className="px-3 py-2 text-center border border-gray-300 whitespace-nowrap">Entrega</th>
                  <th className="px-3 py-2 text-center border border-gray-300 whitespace-nowrap">Exportado</th>
                  <th className="px-3 py-2 text-center border border-gray-300 whitespace-nowrap">Detalhes</th>
                </tr>
              </thead>

              <tbody>
                {Array.from({ length: 10 }).map((_, i) => (
                  <tr
                    key={i}
                    className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-300"
                  >
                    {/* 🔹 Coluna fixa */}
                    <td className="sticky left-0 bg-white z-[5] px-3 py-2 border border-gray-300 whitespace-nowrap">
                      001399
                    </td>

                    <td className="px-3 py-2 border border-gray-300">
                      Centro De Idiomas Gobbi Ltda - Me
                    </td>
                    <td className="px-3 py-2 border border-gray-300 whitespace-nowrap">{formatPrice(507.85)}</td>
                    <td className="px-3 py-2 border border-gray-300 whitespace-nowrap">{formatPrice(36.13)}</td>
                    <td className="px-3 py-2 border border-gray-300 text-right">{formatPrice(0.00)}</td>
                    <td className="px-3 py-2 border border-gray-300 text-right">{formatPrice(543.98)}</td>
                    <td className="px-3 py-2 border border-gray-300 text-right">21-10-2025</td>
                    <td className="px-3 py-2 border border-gray-300 text-right">10-11-2025</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">Sim</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">
                      <Search
                        className="mx-auto cursor-pointer hover:text-primary"
                        onClick={() => alert("abrir página do produto")}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
