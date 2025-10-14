"use client";
import { TitleSection } from "@/app/components/TitleSection";
import { formatPrice } from "@/app/utils/formatter";
import { Eye, NotebookPen, Search, TableProperties } from "lucide-react";
import { useForm } from "react-hook-form";

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
                  title="Gerar Planilha"
                  className="px-4 md:px-6 py-1 md:py-2 h-fit flex text-xs md:text-sm lg:text-base items-center gap-2 text-Button-text bg-green-500 rounded-md cursor-pointer hover:bg-green-700"
                >
                  <TableProperties className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
                </button>
              </div>
            </div>
          </form>
        </div>
        <div className="w-full h-full min-h-[600px] overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm">
              <table className="min-w-full text-xs md:text-sm text-gray-700 border-collapse">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left border border-gray-300 whitespace-nowrap">Produto</th>
                    <th className="px-3 py-2 text-left border border-gray-300 whitespace-normal">Descrição</th>
                    <th className="px-3 py-2 text-left border border-gray-300">Janeiro</th>
                    <th className="px-3 py-2 text-left border border-gray-300">Fevereiro</th>
                    <th className="px-3 py-2 text-left border border-gray-300">Março</th>
                    <th className="px-3 py-2 text-left border border-gray-300">Abril</th>
                    <th className="px-3 py-2 text-left border border-gray-300">Maio</th>
                    <th className="px-3 py-2 text-left border border-gray-300">Junho</th>
                    <th className="px-3 py-2 text-left border border-gray-300">Julho</th>
                    <th className="px-3 py-2 text-left border border-gray-300">Agosto</th>
                    <th className="px-3 py-2 text-left border border-gray-300">Setembro</th>
                    <th className="px-3 py-2 text-left border border-gray-300">Outubro</th>
                    <th className="px-3 py-2 text-left border border-gray-300">Novembro</th>
                    <th className="px-3 py-2 text-left border border-gray-300">Dezembro</th>
                    <th className="px-3 py-2 text-left border border-gray-300">Total</th>
                    <th className="px-3 py-2 text-left border border-gray-300 whitespace-nowrap">Média A</th>
                    <th className="px-3 py-2 text-left border border-gray-300 whitespace-nowrap">Média 2M</th>
                    <th className="px-3 py-2 text-left border border-gray-300">Estoque</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors">
                    <td className="px-3 py-2 border border-gray-300 whitespace-nowrap">2053-amil</td>
                    <td className="px-3 py-2 border border-gray-300 whitespace-normal min-w-32">
                      Calendário organizador interativo. Base em triplex 300gr, 6 lâminas frente e verso em offset e
                      400...
                    </td>
                    <td className="px-3 py-2 border border-gray-300 text-center">11020</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1500</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">600</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">100</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1600</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">3300</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1600</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1400</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1150</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">2150</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">0</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">0</td>
                    <td className="px-3 py-2 border border-gray-300 text-center font-semibold text-gray-800">24420</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">2442</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1275</td>
                    <td className="px-3 py-2 border border-gray-300 text-center text-green-600 font-semibold">0</td>
                  </tr>
                  <tr className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors">
                    <td className="px-3 py-2 border border-gray-300 whitespace-nowrap">2053-amil</td>
                    <td className="px-3 py-2 border border-gray-300">
                      Calendário organizador interativo. Base em triplex 300gr, 6 lâminas frente e verso em offset e
                      400...
                    </td>
                    <td className="px-3 py-2 border border-gray-300 text-center">11020</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1500</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">600</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">100</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1600</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">3300</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1600</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1400</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1150</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">2150</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">0</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">0</td>
                    <td className="px-3 py-2 border border-gray-300 text-center font-semibold text-gray-800">24420</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">2442</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1275</td>
                    <td className="px-3 py-2 border border-gray-300 text-center text-green-600 font-semibold">6400</td>
                  </tr>
                  <tr className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors">
                    <td className="px-3 py-2 border border-gray-300 whitespace-nowrap">2053-amil</td>
                    <td className="px-3 py-2 border border-gray-300">
                      Calendário organizador interativo. Base em triplex 300gr, 6 lâminas frente e verso em offset e
                      400...
                    </td>
                    <td className="px-3 py-2 border border-gray-300 text-center">11020</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1500</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">600</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">100</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1600</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">3300</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1600</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1400</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1150</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">2150</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">0</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">0</td>
                    <td className="px-3 py-2 border border-gray-300 text-center font-semibold text-gray-800">24420</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">2442</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1275</td>
                    <td className="px-3 py-2 border border-gray-300 text-center text-green-600 font-semibold">6400</td>
                  </tr>
                  <tr className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors">
                    <td className="px-3 py-2 border border-gray-300 whitespace-nowrap">2053-amil</td>
                    <td className="px-3 py-2 border border-gray-300">
                      Calendário organizador interativo. Base em triplex 300gr, 6 lâminas frente e verso em offset e
                      400...
                    </td>
                    <td className="px-3 py-2 border border-gray-300 text-center">11020</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1500</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">600</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">100</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1600</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">3300</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1600</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1400</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1150</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">2150</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">0</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">0</td>
                    <td className="px-3 py-2 border border-gray-300 text-center font-semibold text-gray-800">24420</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">2442</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1275</td>
                    <td className="px-3 py-2 border border-gray-300 text-center text-green-600 font-semibold">6400</td>
                  </tr>
                  <tr className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors">
                    <td className="px-3 py-2 border border-gray-300 whitespace-nowrap">2053-amil</td>
                    <td className="px-3 py-2 border border-gray-300">
                      Calendário organizador interativo. Base em triplex 300gr, 6 lâminas frente e verso em offset e
                      400...
                    </td>
                    <td className="px-3 py-2 border border-gray-300 text-center">11020</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1500</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">600</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">100</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1600</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">3300</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1600</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1400</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1150</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">2150</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">0</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">0</td>
                    <td className="px-3 py-2 border border-gray-300 text-center font-semibold text-gray-800">24420</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">2442</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1275</td>
                    <td className="px-3 py-2 border border-gray-300 text-center text-green-600 font-semibold">6400</td>
                  </tr>
                  <tr className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors">
                    <td className="px-3 py-2 border border-gray-300 whitespace-nowrap">2053-amil</td>
                    <td className="px-3 py-2 border border-gray-300">
                      Calendário organizador interativo. Base em triplex 300gr, 6 lâminas frente e verso em offset e
                      400...
                    </td>
                    <td className="px-3 py-2 border border-gray-300 text-center">11020</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1500</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">600</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">100</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1600</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">3300</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1600</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1400</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1150</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">2150</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">0</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">0</td>
                    <td className="px-3 py-2 border border-gray-300 text-center font-semibold text-gray-800">24420</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">2442</td>
                    <td className="px-3 py-2 border border-gray-300 text-center">1275</td>
                    <td className="px-3 py-2 border border-gray-300 text-center text-green-600 font-semibold">6400</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
