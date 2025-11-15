"use client";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { type MouseEvent, useState } from "react";

interface ModalZoomProps {
  productImagens: string[];
  targetZoom: string;
  closeZoom: () => void;
}

export function ZoomProduct({ productImagens, targetZoom, closeZoom }: ModalZoomProps) {
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [currentImage, setCurrentImage] = useState<string>(targetZoom);
  const [zoomPosition, setZoomPosition] = useState<{ x: number; y: number }>({
    x: 500,
    y: 500,
  });

  const handleZoomToggle = () => {
    setIsZoomed(!isZoomed);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;

    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 1050;
    const y = ((e.clientY - top) / height) * 1050;

    setZoomPosition({ x, y });
  };

  const handleMouseEnter = (imgSrc: string) => {
    setCurrentImage(imgSrc);
  };

  return (
    <div className="scrollbar w-[94%] lg:w-screen h-[90dvh] lg:h-[80dvh] 2xl:h-[85dvh] 2xl:max-w-7xl lg:max-w-5xl p-1 md:p-6 mt-12 rounded-xl bg-modalProduct-bgModal z-50 fixed flex flex-col lg:flex-row overflow-y-auto">
      <div
        className="bg-modalProduct-bgModal w-8 h-8 absolute right-2 top-2 flex justify-center items-center rounded-full z-50"
        onClick={closeZoom}
      >
        <X className="text-red-700 hover:text-red-800 cursor-pointer" aria-label="Fechar modal" size={28} />
      </div>

      {/* Imagem com zoom */}
      <div className="w-full h-full flex flex-col-reverse lg:flex-row md:gap-8 relative items-center justify-center p-2 lg:p-4 rounded-lg">
        {/* Galeria de miniaturas */}
        <div className="w-full lg:w-fit h-fit lg:h-full flex items-start justify-start lg:justify-center relative p-1 mt-4">
          <ChevronLeft size={32} className="hidden md:visible  -left-2 top-1/1 cursor-pointer" />
          <div className="w-28 h-fit p-2 flex flex-col gap-2 lg:gap-4 justify-start relative overflow-x-auto">
            {productImagens.map((image, index) => (
              <Image
                key={image}
                src={image}
                width={1000}
                height={1000}
                alt={`Product image ${index}`}
                className={`w-full h-full object-contain cursor-pointer rounded-lg 
                                    ${currentImage === image ? "border-2 border-primary" : ""}`}
                onMouseEnter={() => handleMouseEnter(image)}
              />
            ))}
          </div>
          <ChevronRight size={32} className="hidden md:visible absolute -right-2 top-1/1 cursor-pointer" />
        </div>
        <div
          className={`w-full h-1/2 lg:h-full flex-1 border-2 object-contain mt-10 lg:mt-0 cursor-zoom-in overflow-hidden border-primary shadow-md rounded-xl relative ${
            isZoomed ? "cursor-zoom-out bg-[200%]" : ""
          }`}
          onClick={handleZoomToggle}
          onMouseMove={handleMouseMove}
        >
          <Image
            className="w-full h-full object-contain"
            fill
            src={currentImage}
            alt="Imagem do produto selecionado ampliada"
            quality={100}
            style={{
              transformOrigin: `${zoomPosition.x}px ${zoomPosition.y}px`,
              transform: isZoomed ? "scale(3)" : "scale(1)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
