"use client";
import { ChevronLeft, ChevronRight, Heart, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import produtos from "../../../data/produtos.json";
import { ModalProduto } from "./ModalProduct";
import { ProdutosGrid } from "../types/responseTypes";

export const Slider = () => {
  const [produto, setProduto] = useState<ProdutosGrid[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const produtoInfoRef = useRef<HTMLDivElement | null>(null);
  const produtoImgRef = useRef<HTMLDivElement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProdutosGrid | null>(null);

  const openModalBySlider = (produto: ProdutosGrid) => {
    setSelectedProduct(produto);
    setIsModalOpen(true);
  };

  const closeModalBySlider = () => {
    setSelectedProduct(null);
    setIsModalOpen(false);
  };

  const handleButtonBuySlider = (product: ProdutosGrid) => {
    openModalBySlider(product);
  };

  function produtosBannerInsert() {
    const productsWithBanner = (produtos as ProdutosGrid[]).filter((item) => item.bannerImg);
    const adapted: ProdutosGrid[] = productsWithBanner.map((item, index) => ({
      id: item.id ?? index,
      codePro: item.codePro,
      product: item.product,
      description: item.description,
      price: item.price,
      srcFrontImage: item.srcFrontImage,
      srcBackImage: item.srcBackImage,
      images: item.images ?? [],
      alt: item.alt ?? "",
      colors: item.colors ?? [],
      sizes: (item.sizes ?? []) as string[],
      chavePro: "",
      bannerImg: item.bannerImg,
      quantidadeEstoquePro: "",
      estControl: "0",
    }));
    setProduto(adapted);
  }

  useEffect(() => {
    produtosBannerInsert();
  }, []);

  const handleNext = useCallback(() => {
    animateSlider("animate-disappear-left", "animate-disappear-right");
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % produto.length);
    }, 800);
  }, [produto.length]);

  const handleBack = () => {
    animateSlider("animate-disappear-left", "animate-disappear-right");
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + produto.length) % produto.length);
    }, 800);
  };

  const handleSelectSlide = (index: number) => {
    animateSlider("animate-disappear-left", "animate-disappear-right");
    setTimeout(() => {
      setCurrentIndex(index);
    }, 800);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 8000);

    return () => clearInterval(interval);
  }, [produto, handleNext]);

  const animateSlider = (infoClass: string, imgClass: string) => {
    if (produtoInfoRef.current) {
      produtoInfoRef.current.classList.add(infoClass);
    }
    if (produtoImgRef.current) {
      produtoImgRef.current.classList.add(imgClass);
    }

    setTimeout(() => {
      if (produtoInfoRef.current) {
        produtoInfoRef.current.classList.remove(infoClass);
      }
      if (produtoImgRef.current) {
        produtoImgRef.current.classList.remove(imgClass);
      }
    }, 800);
  };

  const currentProduct = produto[currentIndex];

  return (
    <div className="bg-linear-to-t from-Slider-bgDegrade to-Slider-bg w-screen h-[420px] min-h-[420px] md:h-[70dvh] max-h-[450px] xl:max-h-[650px] 2xl:max-h-[700px] flex items-center justify-center relative overflow-hidden">
      <ChevronLeft
        className="absolute hidden md:block left-2 cursor-pointer text-white opacity-70 z-20"
        onClick={handleBack}
        size={38}
      />
      <ChevronRight
        className="absolute right-2 hidden md:block cursor-pointer text-white opacity-70 z-20"
        onClick={handleNext}
        size={38}
      />
      {produto.length > 0 && currentProduct.bannerImg && (
        <>
          <div className="w-1/2 h-full py-8 flex items-center justify-end pl-6 lg:pl-0">
            <div
              className="w-fit h-fit flex flex-col justify-center lg:items-start animate-appear-left"
              ref={produtoInfoRef}
            >
              <p className="flex gap-1 w-36 lg:w-96 items-center text-white text-sm 2xl:text-xl">
                <Heart className="text-green-400  text-sm xl:text-base 2xl:text-xl" fill="currentColor" stroke="none" />
                Recomendados
              </p>
              <p className="flex items-start justify-center flex-col text-white w-full sm:w-[300px] lg:w-[400px] text-xl 2xl:text-3xl font-semibold min-h-[6rem]">
                {currentProduct.product}
              </p>
              <button
                className="flex items-center justify-center w-[120px] lg:[150px] min-h-8 md:min-h-[40px] gap-2 mt-4 text-xs  bg-green-500 hover:bg-green-400 rounded-md text-white cursor-pointer"
                name={String(currentProduct.id)}
                onClick={() => handleButtonBuySlider(currentProduct)}
              >
                <ShoppingCart size={20} />
                Comprar
              </button>
            </div>
          </div>
          <div className="w-1/2 h-full flex items-center justify-start">
            <div className="w-[300px] h-[60%] 2xl:w-[400px] bg-gradient-to-t from-Slider-bgDegrade to-Slider-bg -skew-x-[20deg] absolute bottom-0 lg:ml-20"></div>
            <div
              ref={produtoImgRef}
              className="flex justify-center xl:justify-start items-center bottom-0 w-full h-full animate-appear-right min-w-[200px] pr-4"
            >
              <Image
                src={currentProduct.bannerImg[0]}
                alt={currentProduct.product}
                width={400}
                height={400}
                className="w-[250px] md:w-[280px] lg:w-[300px] 2xl:w-[400px]"
                priority
              />
              <Image
                src={currentProduct.bannerImg[1]}
                alt={currentProduct.product}
                className="hidden md:block w-[130px] lg:w-[190px] 2xl:w-[250px]"
                width={250}
                height={250}
                priority
              />
            </div>
          </div>
          <div className="w-full py-2 absolute bottom-1 flex justify-center gap-2 items-center">
            {produto.map((_, index) => (
              <div
                key={index}
                onClick={() => handleSelectSlide(index)}
                className={`rounded-full h-4 w-4 cursor-pointer transition-all duration-300 ${index === currentIndex ? "scale-125 bg-green-500" : "bg-white scale-100"
                  }`}
              />
            ))}
          </div>
        </>
      )}

      {isModalOpen && selectedProduct !== null && (
        <ModalProduto ProductData={selectedProduct} onClose={closeModalBySlider} />
      )}
    </div>
  );
};
