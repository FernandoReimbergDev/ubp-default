"use client";

import { Button } from "./Button";
import { CardProduto } from "./CardProduct";
import { ModalProduto } from "./ModalProduct";
import { useProducts } from "../Context/ProductsContext";
import { useMemo, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { SkeletonCardProduto } from "./SkeletonCardProduto";
import { ProdutosGrid } from "../types/responseTypes";

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
    <div className="mx-auto w-[320px] sm:w-full flex justify-center">
      <div className="w-full containerProdutos flex flex-wrap justify-start sm:grid sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 justify-items-center items-center">
        {produtosAdaptados.map((produto) => (
          <div key={produto.codePro} className="produto-container">
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
        ))}
      </div>

      {isModalOpen && selectedProduct && <ModalProduto ProductData={selectedProduct} onClose={closeModal} />}
    </div>
  );
};
