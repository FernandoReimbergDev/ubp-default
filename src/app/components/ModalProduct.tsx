"use client";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Minus, Plus, ShoppingCart, Tag, X } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useCart } from "../Context/CartContext";
import { useToast } from "../Context/ToastProvider";
import { ModalProps, ProdutoCart } from "../types/responseTypes";
import { formatPrice } from "../utils/formatter";
import { Button } from "./Button";
import { ZoomProduct } from "./ZoomProduct";

export function ModalProduto({ ProductData, onClose }: ModalProps) {
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [zoomModal, setZoomModal] = useState(false);
  const [quantity, setQuantity] = useState<string>("");
  const [subtotal, setSubtotal] = useState<number>(0);
  const [QtdMsg, setQtdMsg] = useState(false);
  const [currentImage, setCurrentImage] = useState<string>(ProductData.srcFrontImage);
  const [descriFull, setDescriFull] = useState(false);
  const toast = useToast();

  const handleDescriFull = () => {
    setDescriFull((prevState) => !prevState);
  };

  useEffect(() => {
    setSelectedColor(ProductData.colors[0]);
    setSelectedSize(ProductData.sizes[0]);
  }, [ProductData]);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
  };
  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
  };

  const handleQuantityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQtdMsg(false);
    const value = event.target.value;
    // Permite apenas números positivos ou vazio
    if (/^\d*$/.test(value)) {
      setQuantity(value);

      const qty = parseInt(value, 10);
      if (!isNaN(qty) && qty > 0) {
        setSubtotal(qty * ProductData.price);
      } else {
        setSubtotal(0);
      }
    }
  };

  const handleMouseEnter = (imgSrc: string) => {
    setCurrentImage(imgSrc);
  };

  const handleZoomModal = () => {
    setZoomModal(true);
  };

  const { addProduct } = useCart();

  const handleAddToCart = () => {
    try {
      const id = `${ProductData.codePro}_${selectedColor}_${selectedSize || "nosize"}`;

      if (quantity <= "" || quantity <= "0") {
        setQtdMsg(true);
        return;
      }

      const productToCart: ProdutoCart = {
        id,
        codPro: ProductData.codePro,
        description: ProductData.description,
        productName: ProductData.product,
        price: ProductData.price,
        quantity: quantity,
        subtotal: subtotal,
        color: selectedColor,
        size: selectedSize,
        images: ProductData.images,
        alt: ProductData.alt,
        cores: ProductData.colors ?? [],
        tamanhos: ProductData.sizes ?? [],
      };

      addProduct(productToCart);
      toast.success("Produto adicionado com sucesso!");
      onClose();
    } catch {
      toast.alert("Ops... Falha ao adicionar produto!");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-40">
      <div className="h-full w-full bg-modalProduct-overlay/50 fixed left-0 top-0 z-50"></div>
      <div className="scrollbar w-[94%] lg:w-screen h-[90dvh] lg:h-[80dvh] 2xl:h-[85dvh] 2xl:max-w-7xl lg:max-w-5xl py-4 mt-12 rounded-xl bg-modalProduct-bgModal z-50 fixed flex flex-col lg:flex-row overflow-y-auto">
        <div
          className="bg-modalProduct-bgModal w-8 h-8 absolute right-2 top-2 flex justify-center items-center rounded-full z-50"
          onClick={onClose}
        >
          <X className="text-red-700 hover:text-red-800 cursor-pointer" aria-label="Fechar modal" size={28} />
        </div>
        {ProductData.promotion && (
          <div className="flex items-center absolute top-4 left-4 font-montserrat font-bold text-sm md:text-xl text-green-600">
            <Tag className="md:size-8 size-4" />-{ProductData.percent_discont}%
          </div>
        )}
        <div className="w-full lg:w-[50%] h-fit lg:h-full flex relative flex-col items-center justify-center p-2 lg:p-4 rounded-lg">
          <div
            className="w-40 h-40 lg:w-80 lg:h-80 object-cover cursor-zoom-in overflow-hidden  border-primary shadow-md rounded-xl relative"
            onClick={handleZoomModal}
          >
            <Image
              className="w-full h-full cursor-zoom-in "
              src={currentImage}
              alt={ProductData.alt}
              width={300}
              height={300}
              quality={100}
            />
          </div>
          <div className="flex items-center justify-center relative h-fit lg:max-w-[400px] lg:w-[400px] w-[250px] ">
            <ChevronLeft size={32} className="hidden md:visible absolute -left-2 top-1/1 cursor-pointer" />
            <div className="w-[90%] lg:w-350px p-2 lg:mt-2 flex gap-2 lg:gap-4 justify-start relative overflow-x-auto">
              {ProductData.images.map((image, index) => (
                <Image
                  key={image}
                  src={image}
                  width={50}
                  height={50}
                  alt={`Product image ${index}`}
                  className={`md:w-16 w-12 lg:w-24 cursor-pointer rounded-lg ${
                    currentImage === image ? "border-2 border-primary" : ""
                  }`}
                  onMouseEnter={() => handleMouseEnter(image)}
                />
              ))}
            </div>
            <ChevronRight size={32} className="hidden md:visible absolute -right-2 top-1/1 cursor-pointer" />
          </div>
        </div>
        <div className="lg:w-[60%] w-[100%] h-full flex flex-col gap-1 2xl:gap-2 items-start px-4 xl:py-4 2xl:py-20 mx-auto">
          <p className="text-blackReference text-md md:text-md 2xl:text-xl font-semibold max-w-[90%] text-primary">
            {ProductData.product}
          </p>
          <p className="text-blackReference scrollbar text-sm md:text-md md:text-md 2xl:text-lg font-Roboto max-w-[90%] ">
            {descriFull
              ? ProductData.description
              : ProductData.description.length > 20 && `${ProductData.description.substring(0, 40)}...`}
          </p>
          {!descriFull ? (
            <p className="text-primary text-xs cursor-pointer flex" onClick={handleDescriFull}>
              Ver descrição completa <ChevronDown size={18} />
            </p>
          ) : (
            <p className="text-primary text-xs cursor-pointer flex" onClick={handleDescriFull}>
              Ocultar descrição completa <ChevronUp size={18} />
            </p>
          )}
          <form
            className="flex flex-col items-start w-full gap-2 md:gap-2 2xl:gap-4 mt-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleAddToCart();
            }}
          >
            {ProductData.sizes.length > 0 && (
              <div>
                <label className="font-bold font-Roboto">Tamanho:</label>
                <div className="flex w-[100%] flex-wrap gap-4 mt-1">
                  {ProductData.sizes.length > 0 &&
                    ProductData.sizes.map((size: string, index: number) => (
                      <label
                        key={size + index}
                        className={`px-3 py-2 2xl:px-4 2xl:py-2 rounded-lg cursor-pointer text-sm lg:text-sm 2xl:text-base ${
                          selectedSize === size
                            ? "bg-modalProduct-button text-white"
                            : "bg-whiteReference hover:bg-modalProduct-hoverButton hover:text-white"
                        }`}
                      >
                        <input
                          type="radio"
                          name="size"
                          value={size}
                          className="hidden"
                          checked={selectedSize === size}
                          onChange={() => handleSizeSelect(size)}
                        />
                        {size}
                      </label>
                    ))}
                </div>
              </div>
            )}
            <div>
              <label className="font-bold font-Roboto">Cor:</label>
              <div className="flex w-[100%] flex-wrap gap-4 mt-1">
                {ProductData.colors.map((color: string, index: number) => (
                  <label
                    key={color + index}
                    className={`px-3 py-2 2xl:px-4 2xl:py-2 rounded-lg cursor-pointer text-sm lg:text-sm 2xl:text-base ${
                      selectedColor === color
                        ? "bg-modalProduct-button text-white"
                        : "bg-whiteReference hover:bg-modalProduct-hoverButton hover:text-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="color"
                      value={color}
                      className="hidden"
                      checked={selectedColor === color}
                      onChange={() => handleColorSelect(color)}
                    />
                    {color}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex flex-col">
              <label className="font-bold font-Roboto" htmlFor="quantity">
                Quantidade:
              </label>
              <div className="flex gap-2 items-center justify-start">
                <span
                  onClick={() => {
                    const qty = parseInt(quantity || "0", 10);
                    if (qty > 1) {
                      const newQty = qty - 1;
                      setQuantity(String(newQty));
                      setSubtotal(newQty * ProductData.price);
                      setQtdMsg(false);
                    }
                  }}
                  className="w-6 h-6 rounded-full select-none flex items-center justify-center bg-modalProduct-button hover:bg-modalProduct-hoverButton text-modalProduct-textButton cursor-pointer text-xl"
                >
                  <Minus size={18} />
                </span>
                <input
                  className="border-2 pl-2 w-20 h-9 rounded-md outline-modalProduct-border"
                  type="text"
                  id="quantity"
                  name="quantity"
                  value={quantity}
                  onChange={handleQuantityChange}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0"
                />
                <span
                  onClick={() => {
                    const qty = parseInt(quantity || "0", 10);
                    const newQty = qty + 1;
                    setQuantity(String(newQty));
                    setSubtotal(newQty * ProductData.price);
                    setQtdMsg(false);
                  }}
                  className="w-6 h-6 rounded-full select-none flex items-center justify-center bg-modalProduct-button hover:bg-modalProduct-hoverButton text-modalProduct-textButton cursor-pointer text-xl"
                >
                  <Plus size={18} />
                </span>
              </div>

              <span className="opacity-60 text-sm pointer-events-none select-none mt-2">
                *Quantidade mínima {1} unidade.
              </span>
            </div>
            <div className="flex gap-4 pointer-events-none select-none">
              <div>
                <label className="font-bold select-none" htmlFor="price">
                  Valor unitário:
                </label>
                <input
                  className="w-32 rounded-md p-1 select-none pointer-events-none"
                  type="text"
                  id="price"
                  name="price"
                  value={formatPrice(ProductData.price)}
                  readOnly
                />
              </div>
              <div>
                <label className="font-bold select-none" htmlFor="subtotal">
                  Subtotal:
                </label>
                <input
                  className="w-32 p-1 rounded-md select-none"
                  type="text"
                  id="subtotal"
                  name="subtotal"
                  value={formatPrice(subtotal)}
                  readOnly
                />
              </div>
            </div>
            {QtdMsg && <span className="text-red-500 text-sm">Digite uma quantidade Valida para prosseguir</span>}
            <Button
              type="submit"
              name="BtnComprar"
              className="flex gap-2 items-center justify-center select-none bg-green-500 hover:bg-green-400 text-white rounded-lg text-sm lg:text-base px-2 py-2 lg:py-2 lg:px-4  cursor-pointer"
            >
              <ShoppingCart size={18} />
              Comprar
            </Button>
          </form>
        </div>
      </div>
      {zoomModal && (
        <ZoomProduct
          productImagens={ProductData.images}
          targetZoom={currentImage}
          closeZoom={() => setZoomModal(false)}
        />
      )}
    </div>
  );
}
