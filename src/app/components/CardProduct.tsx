import { formatPrice } from "@/app/utils/formatter";
import { ShoppingCart, Tag } from "lucide-react";
import Image from "next/image";
import { CardProdutoProps } from "../types/responseTypes";
import { Button } from "./Button";

export function CardProduto({
  srcFront,
  alt,
  click,
  nameProduct,
  priceProduct,
  btn,
  promotion = false,
  percent_discont = 0,
}: CardProdutoProps) {
  const hasDiscount = promotion && percent_discont > 0;
  const discountedPrice = hasDiscount ? priceProduct * (1 - percent_discont / 100) : priceProduct;

  return (
    <div
      onClick={click}
      className="w-[150px] md:w-[210px] h-[270px] sm:h-[260px] md:h-[320px] p-2 md:p-4 overflow-hidden shadow-lg rounded-xl flex flex-col justify-start items-start cursor-pointer relative bg-whiteReference group"
    >
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
          className="w-full group-hover:rotate-6 transition-all group-hover:scale-110 duration-300 object-cover"
          loading="lazy"
        />
      </div>

      <p className="h-[2.5rem] sm:h-[2.5rem] md:h-[3.1.5rem] sm:w-full font-Roboto font-semibold text-sm md:text-base my-1 leading-snug overflow-hidden text-blackReference">
        {nameProduct}
      </p>

      <div className="flex items-center justify-between w-full mt-2">
        <div className="flex flex-col">
          {hasDiscount && (
            <p className="font-bold text-xs md:text-sm text-gray-600 font-Roboto line-through">
              {formatPrice(priceProduct)}
            </p>
          )}
          <p className="font-bold text-sm md:text-lg text-blackReference font-Roboto">{formatPrice(discountedPrice)}</p>
        </div>
        {btn}
      </div>

      <p className="text-xs text-grayReference">*frete não incluso</p>
    </div>
  );
}

export function CardDefault({
  srcFront,
  alt,
  nameProduct,
  priceProduct,
}: // btn,
// promotion = false,
// percent_discont = 0,
CardProdutoProps) {
  // const hasDiscount = promotion && percent_discont > 0;
  // const discountedPrice = hasDiscount
  //   ? priceProduct * (1 - percent_discont / 100)
  //   : priceProduct;

  return (
    <div className="w-[150px] h-[280px]  sm:w-[220px] sm:h-[320px]  md:w-[230px] md:h-[355px] p-2.5 shadow-md outline-none hover:outline hover:outline-primary rounded-xl flex flex-col justify-start items-center cursor-pointer relative">
      <div className="w-full md:w-[200px] relative">
        <div className="overflow-hidden justify-self-center self-center w-fit mx-auto">
          <Image
            src={srcFront}
            alt={alt}
            width={250}
            height={250}
            className="w-[100%] group-hover:rotate-6 transition-all group-hover:scale-110 duration-300"
            loading="lazy"
          />
        </div>
      </div>
      <p className="h-[3rem] sm:h-[4rem] sm:w-[220px] font-semibold text-base text-center my-1 leading-snug overflow-hidden text-primary">
        {nameProduct}
      </p>
      <p className="font-medium mb-1">{priceProduct}</p>
      <p className="text-sm text-zinc-700">*frete não incluso</p>
      <Button className="flex items-center justify-center gap-2 w-[100px] xl:w-[120px] min-h-8 md:min-h-[35px] bg-primary hover:bg-primaryVariant rounded-md text-white text-sm">
        Adicionar
        <ShoppingCart size={18} />
      </Button>
    </div>
  );
}
