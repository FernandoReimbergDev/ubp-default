"use client";
import { TitleSection } from "@/app/components/TitleSection";
import { exportExcelFile } from "../../../services/gerarPlanilha";
import { NotebookPen, Search, TableProperties } from "lucide-react";
// import { useForm } from "react-hook-form";

export default function ProdutoConsulta() {
  // const { register, watch } = useForm();
  // const categoria = watch("categoria");
  // const data = watch("data");

  // const produtosFiltrados = produtos.filter((prod) => {
  //   return (!categoria || prod.categoria === categoria) && (!data || prod.data >= data);
  // });
  return (
    <div className="min-h-[calc(100dvh-114px)] w-full max-w-[96vw] mx-auto flex flex-col lg:flex-row bg-white pt-14 p-4 mt-10">
      <div className="w-full max-w-[96vw] flex flex-col bg-white mx-auto p-4 rounded-2xl">
        <TitleSection
          text="Relatório | Produto Disponibilidade"
          icon={<NotebookPen size={28} className="text-green-600" />}
        />
        <div className="pt-8 pb-4">
          <form method="POST">
            <div className="flex flex-col md:flex-row gap-2 items-end">
              <div className="flex gap-2 justify-start w-full md:w-fit">
                <div className="w-full max-w-46 text-xs md:text-sm lg:text-base">
                  <label className="text-xs 2xl:text-sm font-medium text-gray-700 flex gap-2">Ano:</label>
                  <input
                    type="text"
                    id="year"
                    defaultValue="2025"
                    // {...register("produto")}
                    className="w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="w-full max-w-46 text-xs md:text-sm lg:text-base">
                  <label className="text-xs 2xl:text-sm font-medium text-gray-700 flex gap-2">
                    Produto:
                    {
                      <Search
                        size={18}
                        className="text-blue-700 cursor-pointer"
                        onClick={() => {
                          alert("exibir input select dos produtos");
                        }}
                      />
                    }
                  </label>
                  <input
                    type="text"
                    id="produto"
                    // {...register("produto")}
                    className="w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-start w-full md:w-fit">
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
                      tableId: "tabela-relatorio",
                      filename: "relatorio-atual.xlsx",
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
        <div className="w-full h-full min-h-[600px]">
          {/* O scroll horizontal precisa estar no mesmo nível do table */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
            <table id="tabela-relatorio" className="min-w-full text-xs md:text-sm text-gray-700 border-collapse">
              <thead className="bg-gray-100 sticky top-0 z-20">
                <tr>
                  {/* 🔹 Primeira coluna fixa */}
                  <th className="sticky left-0 z-30 bg-gray-100 px-3 py-2 text-left border border-gray-300 whitespace-nowrap shadow-[4px_0_6px_-4px_rgba(0,0,0,0.1)]">
                    Produto
                  </th>
                  <th className="px-3 py-2 text-left border border-gray-300 whitespace-normal">Descrição</th>
                  <th className="px-3 py-2 text-center border border-gray-300">Janeiro</th>
                  <th className="px-3 py-2 text-center border border-gray-300">Fevereiro</th>
                  <th className="px-3 py-2 text-center border border-gray-300">Março</th>
                  <th className="px-3 py-2 text-center border border-gray-300">Abril</th>
                  <th className="px-3 py-2 text-center border border-gray-300">Maio</th>
                  <th className="px-3 py-2 text-center border border-gray-300">Junho</th>
                  <th className="px-3 py-2 text-center border border-gray-300">Julho</th>
                  <th className="px-3 py-2 text-center border border-gray-300">Agosto</th>
                  <th className="px-3 py-2 text-center border border-gray-300">Setembro</th>
                  <th className="px-3 py-2 text-center border border-gray-300">Outubro</th>
                  <th className="px-3 py-2 text-center border border-gray-300">Novembro</th>
                  <th className="px-3 py-2 text-center border border-gray-300">Dezembro</th>
                  <th className="px-3 py-2 text-center border border-gray-300">Total</th>
                  <th className="px-3 py-2 text-center border border-gray-300 whitespace-nowrap">Média A</th>
                  <th className="px-3 py-2 text-center border border-gray-300 whitespace-nowrap">Média 2M</th>
                  <th className="px-3 py-2 text-center border border-gray-300">Estoque</th>
                </tr>
              </thead>

              <tbody>
                {Array.from({ length: 20 }).map((_, i) => (
                  <tr key={i} className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors">
                    {/* 🔹 Primeira coluna fixa */}
                    <td className="sticky left-0 bg-white z-[5] px-3 py-2 border border-gray-300 whitespace-nowrap shadow-[4px_0_6px_-4px_rgba(0,0,0,0.1)]">
                      2053-amil
                    </td>

                    <td className="px-3 py-2 border border-gray-300 min-w-32">
                      Calendário organizador interativo. Base em triplex 300gr, 6 lâminas frente e verso em offset e
                      400...
                    </td>

                    {[11020, 1500, 600, 100, 1600, 3300, 1600, 1400, 1150, 2150, 0, 0, 24420, 2442, 1275, 500].map(
                      (val, j) => (
                        <td
                          key={j}
                          className={`px-3 py-2 border border-gray-300 text-center ${j === 12 ? "font-semibold text-gray-800" : j === 14 ? "text-green-600 font-semibold" : ""
                            }`}
                        >
                          {val}
                        </td>
                      )
                    )}
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
