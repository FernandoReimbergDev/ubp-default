"use client";
import { TitleSection } from "@/app/components/TitleSection";
import { formatPrice } from "@/app/utils/formatter";
import { Eye, Package, Search } from "lucide-react";
import { useForm } from "react-hook-form";

export default function EstoqueConsulta() {
  // const { register, watch } = useForm();
  // const categoria = watch("categoria");
  // const data = watch("data");

  // const produtosFiltrados = produtos.filter((prod) => {
  //   return (!categoria || prod.categoria === categoria) && (!data || prod.data >= data);
  // });

  return (
    <div className="min-h-[calc(100dvh-114px)] w-full flex flex-col lg:flex-row bg-white pt-14 p-4 mt-10">
      <div className="flex flex-col bg-white mx-auto p-4 rounded-2xl">
        <TitleSection text="Estoque | Consulta" icon={<Package size={28} className="text-green-600" />} />
        <div className="pt-8 pb-4">
          <form method="POST">
            <div className="flex gap-8 items-end">
              <div className="w-46">
                <label className="text-xs 2xl:text-sm font-medium text-gray-700 flex gap-2">
                  Produto:{" "}
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
              <div className="w-46">
                <label className="block text-xs 2xl:text-sm font-medium text-gray-700">Agrupar Produto:</label>
                <select
                  name="agrupar"
                  id="agrupar"
                  className="w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="sim">Sim</option>
                  <option value="sim">Náo</option>
                </select>
              </div>

              <div className="w-46">
                <label className="block text-xs 2xl:text-sm font-medium text-gray-700">Cor:</label>
                <select
                  disabled
                  name="color"
                  id="color"
                  className="w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value=""></option>
                </select>
              </div>
              <div className="w-46">
                <label className="block text-xs 2xl:text-sm font-medium text-gray-700">Tamanho:</label>
                <select
                  disabled
                  name="size"
                  id="size"
                  className="w-full mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value=""></option>
                </select>
              </div>
              <button className="px-8 py-2 h-fit text-Button-text bg-Button-bg rounded-xl cursor-pointer hover:bg-secondary">
                Filtrar
              </button>
              <button className="px-8 py-2 h-fit text-Button-text bg-gray-700 rounded-xl cursor-pointer hover:bg-secondary">
                Redefinir
              </button>
            </div>
          </form>

          <div className="flex gap-8 mt-4">
            <div>
              <p className="text-xs 2xl:text-sm font-medium text-gray-700 flex gap-2">Valor Total:</p>
              <p className="w-46 mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md text-center bg-gray-200">
                {formatPrice(54584.28)}
              </p>
            </div>

            <div>
              <p className="text-xs 2xl:text-sm font-medium text-gray-700 flex gap-2">Quantidade Total:</p>
              <p className="w-46 mx-auto px-2 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md text-center bg-gray-200">
                {11859}
              </p>
            </div>
          </div>
        </div>
        <div className="w-full h-full min-h-[600px] overflow-auto">
          <table className="w-full border border-gray-300-collapse text-sm">
            <thead className="border border-gray-300">
              <tr className="bg-gray-100 text-gray-700 sticky top-0">
                <th className="border border-gray-300 px-3 py-2 text-left whitespace-nowrap">Produto:</th>
                <th className="border border-gray-300 px-3 py-2 text-left whitespace-nowrap">Descrição</th>
                <th className="border border-gray-300 px-3 py-2 text-left whitespace-nowrap">Cor</th>
                <th className="border border-gray-300 px-3 py-2 text-left whitespace-nowrap">Tamanho</th>
                <th className="border border-gray-300 px-3 py-2 text-left whitespace-nowrap">Saldo</th>
                <th className="border border-gray-300 px-3 py-2 text-left whitespace-nowrap">Valor Unitário</th>
                <th className="border border-gray-300 px-3 py-2 text-left whitespace-nowrap">Subtotal</th>
                <th className="border border-gray-300 px-3 py-2 text-left whitespace-nowrap">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border border-gray-300">
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">2053-amil</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">
                  Caléndario organizador interativo Base em triplex 300gr, 6 lâminas frente e verso em offset e 400...
                </td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">impressão</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300"></td>
                <td className="px-3 py-2 text-right whitespace-nowrap border border-gray-300">100</td>
                <td className="px-3 py-2 text-right whitespace-nowrap border border-gray-300">{formatPrice(8.56)}</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">{formatPrice(100 * 8.56)}</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">
                  <Eye
                    className="mx-auto cursor-pointer hover:text-primary"
                    onClick={() => alert("abrir pagina do produto")}
                  />
                </td>
              </tr>
              <tr className="border border-gray-300">
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">2053-amil</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">
                  Caléndario organizador interativo Base em triplex 300gr, 6 lâminas frente e verso em offset e 400...
                </td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">impressão</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300"></td>
                <td className="px-3 py-2 text-right whitespace-nowrap border border-gray-300">100</td>
                <td className="px-3 py-2 text-right whitespace-nowrap border border-gray-300">{formatPrice(8.56)}</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">{formatPrice(100 * 8.56)}</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">
                  <Eye
                    className="mx-auto cursor-pointer hover:text-primary"
                    onClick={() => alert("abrir pagina do produto")}
                  />
                </td>
              </tr>
              <tr className="border border-gray-300">
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">2053-amil</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">
                  Caléndario organizador interativo Base em triplex 300gr, 6 lâminas frente e verso em offset e 400...
                </td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">impressão</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300"></td>
                <td className="px-3 py-2 text-right whitespace-nowrap border border-gray-300">100</td>
                <td className="px-3 py-2 text-right whitespace-nowrap border border-gray-300">{formatPrice(8.56)}</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">{formatPrice(100 * 8.56)}</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">
                  <Eye
                    className="mx-auto cursor-pointer hover:text-primary"
                    onClick={() => alert("abrir pagina do produto")}
                  />
                </td>
              </tr>
              <tr className="border border-gray-300">
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">2053-amil</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">
                  Caléndario organizador interativo Base em triplex 300gr, 6 lâminas frente e verso em offset e 400...
                </td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">impressão</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300"></td>
                <td className="px-3 py-2 text-right whitespace-nowrap border border-gray-300">100</td>
                <td className="px-3 py-2 text-right whitespace-nowrap border border-gray-300">{formatPrice(8.56)}</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">{formatPrice(100 * 8.56)}</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">
                  <Eye
                    className="mx-auto cursor-pointer hover:text-primary"
                    onClick={() => alert("abrir pagina do produto")}
                  />
                </td>
              </tr>
              <tr className="border border-gray-300">
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">2053-amil</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">
                  Caléndario organizador interativo Base em triplex 300gr, 6 lâminas frente e verso em offset e 400...
                </td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">impressão</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300"></td>
                <td className="px-3 py-2 text-right whitespace-nowrap border border-gray-300">100</td>
                <td className="px-3 py-2 text-right whitespace-nowrap border border-gray-300">{formatPrice(8.56)}</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">{formatPrice(100 * 8.56)}</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">
                  <Eye
                    className="mx-auto cursor-pointer hover:text-primary"
                    onClick={() => alert("abrir pagina do produto")}
                  />
                </td>
              </tr>
              <tr className="border border-gray-300">
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">2053-amil</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">
                  Caléndario organizador interativo Base em triplex 300gr, 6 lâminas frente e verso em offset e 400...
                </td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">impressão</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300"></td>
                <td className="px-3 py-2 text-right whitespace-nowrap border border-gray-300">100</td>
                <td className="px-3 py-2 text-right whitespace-nowrap border border-gray-300">{formatPrice(8.56)}</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">{formatPrice(100 * 8.56)}</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">
                  <Eye
                    className="mx-auto cursor-pointer hover:text-primary"
                    onClick={() => alert("abrir pagina do produto")}
                  />
                </td>
              </tr>
              <tr className="border border-gray-300">
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">2053-amil</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">
                  Caléndario organizador interativo Base em triplex 300gr, 6 lâminas frente e verso em offset e 400...
                </td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">impressão</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300"></td>
                <td className="px-3 py-2 text-right whitespace-nowrap border border-gray-300">100</td>
                <td className="px-3 py-2 text-right whitespace-nowrap border border-gray-300">{formatPrice(8.56)}</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">{formatPrice(100 * 8.56)}</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">
                  <Eye
                    className="mx-auto cursor-pointer hover:text-primary"
                    onClick={() => alert("abrir pagina do produto")}
                  />
                </td>
              </tr>
              <tr className="border border-gray-300">
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">2053-amil</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">
                  Caléndario organizador interativo Base em triplex 300gr, 6 lâminas frente e verso em offset e 400...
                </td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">impressão</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300"></td>
                <td className="px-3 py-2 text-right whitespace-nowrap border border-gray-300">100</td>
                <td className="px-3 py-2 text-right whitespace-nowrap border border-gray-300">{formatPrice(8.56)}</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">{formatPrice(100 * 8.56)}</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">
                  <Eye
                    className="mx-auto cursor-pointer hover:text-primary"
                    onClick={() => alert("abrir pagina do produto")}
                  />
                </td>
              </tr>
              <tr className="border border-gray-300">
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">2053-amil</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">
                  Caléndario organizador interativo Base em triplex 300gr, 6 lâminas frente e verso em offset e 400...
                </td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">impressão</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300"></td>
                <td className="px-3 py-2 text-right whitespace-nowrap border border-gray-300">100</td>
                <td className="px-3 py-2 text-right whitespace-nowrap border border-gray-300">{formatPrice(8.56)}</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">{formatPrice(100 * 8.56)}</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">
                  <Eye
                    className="mx-auto cursor-pointer hover:text-primary"
                    onClick={() => alert("abrir pagina do produto")}
                  />
                </td>
              </tr>
              <tr className="border border-gray-300">
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">2053-amil</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">
                  Caléndario organizador interativo Base em triplex 300gr, 6 lâminas frente e verso em offset e 400...
                </td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">impressão</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300"></td>
                <td className="px-3 py-2 text-right whitespace-nowrap border border-gray-300">100</td>
                <td className="px-3 py-2 text-right whitespace-nowrap border border-gray-300">{formatPrice(8.56)}</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">{formatPrice(100 * 8.56)}</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">
                  <Eye
                    className="mx-auto cursor-pointer hover:text-primary"
                    onClick={() => alert("abrir pagina do produto")}
                  />
                </td>
              </tr>
              <tr className="border border-gray-300">
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">2053-amil</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">
                  Caléndario organizador interativo Base em triplex 300gr, 6 lâminas frente e verso em offset e 400...
                </td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">impressão</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300"></td>
                <td className="px-3 py-2 text-right whitespace-nowrap border border-gray-300">100</td>
                <td className="px-3 py-2 text-right whitespace-nowrap border border-gray-300">{formatPrice(8.56)}</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">{formatPrice(100 * 8.56)}</td>
                <td className="px-3 py-2 whitespace-nowrap border border-gray-300">
                  <Eye
                    className="mx-auto cursor-pointer hover:text-primary"
                    onClick={() => alert("abrir pagina do produto")}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
