"use client";

import { Button } from "./Button";
import { CardProduto } from "./CardProduct";
import { ModalProduto } from "./ModalProduct";
import { useProducts } from "../Context/ProductsContext";
import { useMemo, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { SkeletonCardProduto } from "./SkeletonCardProduto";
import { ProdutosGrid } from "../types/responseTypes";
import { formatPrice } from "../utils/formatter";
import Image from "next/image";

export const GridProducts = () => {
  const { products, loading, error } = useProducts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProdutosGrid | null>(null);

  const openModal = (produto: ProdutosGrid) => {
    setSelectedProduct(produto);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setIsModalOpen(false);
  };

  const handleButtonBuy = (product: ProdutosGrid) => {
    openModal(product);
  };

  const produtosAdaptados: ProdutosGrid[] = useMemo(() => {
    return products.map((pro, index) => {
      const imagensValidas = pro.imagens
        ?.map((img) => img.urlProImgSuper || img.urlProImg || "")
        .filter((url) => url !== "");

      return {
        id: index,
        codePro: pro.codPro,
        chavePro: pro.chavePro,
        product: pro.descr,
        description: pro.descr2,
        price: Number(pro.precos?.[0]?.vluProPrc || 0),
        srcFrontImage: imagensValidas?.[0] || "/placeholder.jpg",
        srcBackImage: imagensValidas?.[1] || imagensValidas?.[0] || "/placeholder.jpg",
        images: imagensValidas || [],
        alt: `imagem do produto ${pro.codPro}`,
        colors: pro.cores?.map((cor) => cor.descrProCor) || [],
        sizes: [] as string[], // Se um dia vier tamanho, adapta aqui
        quantidadeEstoquePro: String(pro.quantidadeEstoquePro ?? ""),
        estControl: pro.estControl,
      };
    });
  }, [products]);

  if (loading) {
    return (
      <div className="mx-auto w-[320px] sm:w-full flex justify-center">
        <div className="w-full containerProdutos flex flex-wrap justify-start sm:grid sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 justify-items-center items-center">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCardProduto key={i} />
          ))}
        </div>
      </div>
    );
  }
  if (error)
    return <p>Desculpe, não foi possivel carregar os produtos, tente novamente atualizando a pagina. {error}</p>;

  return (
    <main className="p-1 md:p-4 min-w-[320px] min-h-0 overflow-y-auto [scrollbar-gutter:stable]">
      <div className="mx-auto w-full max-w-7xl space-y-6">

        <section className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">
          <aside className="rounded-lg bg-white shadow-sm p-4">
            <h2 className="mb-3 text-lg font-medium text-gray-900">Filtros</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-800">Preço</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Mín"
                    className="w-1/2 rounded-md border border-gray-300 px-2 py-1 text-sm"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    placeholder="Máx"
                    className="w-1/2 rounded-md border border-gray-300 px-2 py-1 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-800">Avaliação</p>
                <div className="space-y-1 text-sm text-gray-700">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" /> 4★ e acima
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" /> 3★ e acima
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" /> 2★ e acima
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-800">Disponibilidade</p>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" /> Em estoque
                </label>
              </div>
              <button className="w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-black">
                Aplicar filtros
              </button>
            </div>
          </aside>

          <div className="space-y-4">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-sm text-gray-600">Mostrando 12 de 128 itens</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Ordenar por</span>
                <select className="rounded-md border border-gray-300 px-2 py-1 text-sm">
                  <option>Mais vendidos</option>
                  <option>Menor preço</option>
                  <option>Maior preço</option>
                  <option>Melhor avaliação</option>
                  <option>Novidades</option>
                </select>
              </div>
            </div>

            <div className="w-full containerProdutos justify-start grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-8 justify-items-center items-center">
              {Array.from({ length: 4 }).map((_, index) => (
                produtosAdaptados.map((produto) => (
                  <div key={`${produto.codePro}-${index}`} className="produto-container">
                    <CardProduto
                      click={() => handleButtonBuy(produto)}
                      srcFront={produto.srcFrontImage}
                      alt={produto.alt}
                      nameProduct={produto.product}
                      priceProduct={produto.price}
                      stock={produto.quantidadeEstoquePro}
                      estControl={produto.estControl}
                      promotion={false}
                      percent_discont={0}
                      btn={
                        <Button
                          onClick={() => handleButtonBuy(produto)}
                          className="flex items-center justify-center w-[50px] xl:w-[50px] min-h-8 md:min-h-[35px] cursor-pointer bg-Button-bg hover:bg-Slider-bgDegrade rounded-md text-white text-sm"
                          name="buttonBuy"
                        >
                          <ShoppingCart size={18} />
                        </Button>
                      }
                    />
                  </div>
                ))
              ))}
            </div>


            <div className="flex items-center justify-center gap-2">
              <button className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
                Anterior
              </button>
              <button className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white">1</button>
              <button className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">2</button>
              <button className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">3</button>
              <button className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
                Próximo
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Fique por dentro das novidades</h3>
              <p className="text-sm text-gray-600">Receba novidades e promoções diretamente no seu e-mail</p>
            </div>
            <div className="flex w-full max-w-md items-center gap-2">
              <input
                type="email"
                placeholder="Seu e-mail"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
              />
              <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black">
                Inscrever
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};
