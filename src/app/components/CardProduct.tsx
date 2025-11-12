import { formatPrice } from "@/app/utils/formatter";
import { Tag } from "lucide-react";
import Image from "next/image";
import { CardProdutoProps } from "../types/responseTypes";

export function CardProduto({
  srcFront,
  alt,
  click,
  nameProduct,
  priceProduct,
  btn,
  stock,
  estControl,
  promotion = false,
  percent_discont = 0,
}: CardProdutoProps) {
  const hasDiscount = promotion && percent_discont > 0;
  const discountedPrice = hasDiscount ? priceProduct * (1 - percent_discont / 100) : priceProduct;

  const hasKnownStock = typeof stock === "string" && stock.trim() !== "";
  const parsedStock = hasKnownStock ? Math.trunc(Number(stock.replace(",", "."))) : undefined;

  const isOutOfStock = estControl === "1" && hasKnownStock && (parsedStock ?? 0) <= 0;

  return (
    <div
      onClick={click}
      className={`w-[150px] md:w-[210px] h-[270px] sm:h-[260px] md:h-[320px] p-2 md:p-4 overflow-hidden shadow-lg rounded-xl flex flex-col justify-start items-start cursor-pointer relative bg-whiteReference group transition-all duration-300
        ${isOutOfStock ? "grayscale opacity-70" : ""}
      `}
    >
      {isOutOfStock && (
        <div className="absolute -right-10 top-6 rotate-45 bg-red-500 text-white text-xs md:text-sm font-bold tracking-wide shadow-lg px-10 py-1 z-20 select-none pointer-events-none">
          ESGOTADO
        </div>
      )}
      {hasDiscount && (
        <div className="flex items-center gap-1 absolute top-2 left-2 bg-green-100 px-2 py-1 rounded-full text-xs font-bold text-green-600 z-10">
          <Tag size={14} />-{percent_discont}%
        </div>
      )}

      <div className="overflow-hidden w-full justify-self-center self-center mx-auto">
        <Image
          src={srcFront}
          alt={alt}
          width={250}
          height={250}
          quality={100}
          className="w-full group-hover:rotate-6 transition-all group-hover:scale-110 duration-300 object-cover"
          loading="lazy"
        />
      </div>

      <p className="line-clamp-2 h-10 md:h-[3.1rem] md:max-h-[3.1rem] sm:w-full font-Roboto font-semibold text-sm md:text-base my-1 leading-snug overflow-hidden text-blackReference">
        {nameProduct}
      </p>

      <div className="flex items-center justify-between w-full mt-2">
        <div className="flex flex-col">
          {hasDiscount && (
            <p className="font-bold text-xs md:text-sm text-gray-600 font-Roboto line-through">
              {formatPrice(priceProduct)}
            </p>
          )}
          {!hasDiscount && (
            <p className="font-bold text-sm md:text-lg text-blackReference font-Roboto">
              {formatPrice(discountedPrice)}
            </p>
          )}
        </div>
        {btn}
      </div>

      <p className="text-xs text-grayReference">*frete não incluso</p>
    </div>
  );
}
