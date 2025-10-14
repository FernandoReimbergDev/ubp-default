"use client";
import { TitleSection } from "@/app/components/TitleSection";
import { exportExcelFile } from "@/app/services/gerarPlanilha";
import { formatPrice } from "@/app/utils/formatter";
import { Eye, Package, Search, TableProperties } from "lucide-react";
import { useForm } from "react-hook-form";

export default function EstoqueConsulta() {
  // const { register, watch } = useForm();
  // const categoria = watch("categoria");
  // const data = watch("data");

  return (
    <div className="min-h-[calc(100dvh-114px)] w-full max-w-[96vw] mx-auto flex flex-col lg:flex-row bg-white pt-14 p-4 mt-10">
      <div className="w-full max-w-[96vw] flex flex-col bg-white mx-auto p-4 rounded-2xl">
        <TitleSection text="Estoque | Consulta" icon={<Package size={28} className="text-green-600" />} />

        {/* 🔍 FILTROS */}
        <div className="pt-8 pb-4">
          <form method="POST">
            <div className="w-full flex flex-col md:flex-row flex-wrap gap-2 md:gap-4 items-end">
              <div className="grid grid-cols-2 sm:flex gap-2 justify-start w-full md:w-fit ">
                {/* PRODUTO */}
                <div className="w-full max-w-46 text-xs md:text-sm lg:text-base">
                  <label className="text-xs 2xl:text-sm font-medium text-gray-700 flex gap-2">
                    Produto:
                    {
                      <Search
                        size={18}
                        className="text-blue-700 cursor-pointer"
                        onClick={() => alert("exibir input select dos produtos")}
                      />
                    }
                  </label>
                  <input
                    type="text"
                    id="produto"
                    className="w-full mx-auto px-1 text-xs py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* AGRUPAR */}
                <div className="w-full max-w-46 text-xs md:text-sm lg:text-base">
                  <label className="block text-xs 2xl:text-sm text-nowrap text-gray-700">Agrupar Produto:</label>
                  <select
                    name="agrupar"
                    id="agrupar"
                    className="w-full mx-auto px-1 text-xs py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="sim">Sim</option>
                    <option value="nao">Não</option>
                  </select>
                </div>

                {/* COR */}
                <div className="w-full max-w-46 min-w-28 text-xs md:text-sm lg:text-base">
                  <label className="block text-xs 2xl:text-sm font-medium text-gray-700">Cor:</label>
                  <select
                    disabled
                    name="color"
                    id="color"
                    className="w-full mx-auto px-1 text-xs py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value=""></option>
                  </select>
                </div>

                {/* TAMANHO */}
                <div className="w-full max-w-46 text-xs md:text-sm lg:text-base">
                  <label className="block text-xs 2xl:text-sm font-medium text-gray-700">Tamanho:</label>
                  <select
                    disabled
                    name="size"
                    id="size"
                    className="w-full mx-auto px-1 text-xs py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value=""></option>
                  </select>
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

          {/* 🔹 RESUMO */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex-1 md:max-w-52">
              <p className="text-xs 2xl:text-sm font-medium text-gray-700">Valor Total:</p>
              <p className="w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md text-center bg-gray-200">
                {formatPrice(54584.28)}
              </p>
            </div>
            <div className="flex-1 md:max-w-52">
              <p className="text-xs 2xl:text-sm font-medium text-gray-700">Quantidade Total:</p>
              <p className="w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md text-center bg-gray-200">
                {11859}
              </p>
            </div>
          </div>
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
                    Produto
                  </th>
                  <th className="px-3 py-2 text-left border border-gray-300">Descrição</th>
                  <th className="px-3 py-2 text-left border border-gray-300 whitespace-nowrap">Cor</th>
                  <th className="px-3 py-2 text-left border border-gray-300 whitespace-nowrap">Tamanho</th>
                  <th className="px-3 py-2 text-right border border-gray-300 whitespace-nowrap">Saldo</th>
                  <th className="px-3 py-2 text-right border border-gray-300 whitespace-nowrap">Valor Unitário</th>
                  <th className="px-3 py-2 text-right border border-gray-300 whitespace-nowrap">Subtotal</th>
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
                      2053-amil
                    </td>

                    <td className="px-3 py-2 border border-gray-300">
                      Calendário organizador interativo. Base em triplex 300gr, 6 lâminas frente e verso em offset e
                      400...
                    </td>
                    <td className="px-3 py-2 border border-gray-300 whitespace-nowrap">impressão</td>
                    <td className="px-3 py-2 border border-gray-300 whitespace-nowrap"></td>
                    <td className="px-3 py-2 border border-gray-300 text-right">100</td>
                    <td className="px-3 py-2 border border-gray-300 text-right">{formatPrice(8.56)}</td>
                    <td className="px-3 py-2 border border-gray-300 text-right">{formatPrice(100 * 8.56)}</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">
                      <Eye
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
