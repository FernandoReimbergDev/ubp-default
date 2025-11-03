"use client";

import { Button } from "./Button";
import { CardProduto } from "./CardProduct";
import { ModalProduto } from "./ModalProduct";
import { useProducts } from "../Context/ProductsContext";
import { useMemo, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { SkeletonCardProduto } from "./SkeletonCardProduto";
import { ProdutosGrid } from "../types/responseTypes";
import { AsideFilter } from "./AsideFilter";

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
      <main className="p-1 md:p-4 min-w-[320px] min-h-0 overflow-y-auto [scrollbar-gutter:stable]">
        <div className="mx-auto w-full max-w-7xl space-y-6">
          <section className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">
            <aside className="rounded-lg bg-white shadow-sm p-4 animate-pulse space-y-4">
              <div className="h-6 w-1/2 bg-gray-200 rounded" />
              <div className="space-y-3">
                <div className="h-4 w-20 bg-gray-200 rounded" />
                <div className="flex items-center gap-2">
                  <div className="h-8 w-1/2 bg-gray-200 rounded" />
                  <div className="h-8 w-1/2 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-4 w-28 bg-gray-200 rounded" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
              </div>
              <div className="h-9 w-full bg-gray-200 rounded" />
            </aside>

            <div className="space-y-4">
              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div className="h-4 w-44 bg-gray-200 rounded animate-pulse" />
                <div className="flex items-center gap-2">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 w-36 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>

              <div className="w-full containerProdutos justify-start grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-8 justify-items-center items-center">
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonCardProduto key={i} />
                ))}
              </div>

              <div className="flex items-center justify-center gap-2">
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }
  if (error)
    return <p>Desculpe, não foi possivel carregar os produtos, tente novamente atualizando a pagina. {error}</p>;

  return (
    <main className="p-1 md:p-4 min-w-[320px] min-h-0 overflow-y-auto [scrollbar-gutter:stable]">
      <div className="mx-auto w-full max-w-7xl space-y-6">

        <section className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">

          <AsideFilter />


          <div className="space-y-4">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-sm text-gray-600">Mostrando 12 de 103 itens</p>
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
        {isModalOpen && selectedProduct && <ModalProduto ProductData={selectedProduct} onClose={closeModal} />}
        {/* <section className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Fique por dentro das novidades</h3>
              <p className="text-sm text-gray-600">Receba novidades e promoções diretamente no seu e-mail</p>
            </div>
            <div className="flex w-full max-w-md items-center gap-2">
              <input
                type="email"
                placeholder="Seu e-mail"
                defaultValue={email}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
              />
              <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black">
                Inscrever
              </button>
            </div>
          </div>
        </section> */}
      </div>
    </main>
  );
};
