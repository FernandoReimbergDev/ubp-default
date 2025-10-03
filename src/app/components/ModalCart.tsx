"use client";
import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "../Context/CartContext";
import { ProdutoCart } from "../types/responseTypes";
import { formatPrice } from "../utils/formatter";
import { Button } from "./Button";
import { TitleSection } from "./TitleSection";

interface ModalProps {
  handleClick?: (event: React.MouseEvent<HTMLButtonElement | SVGSVGElement | HTMLDivElement, MouseEvent>) => void;
  isOpen: boolean;
}

export const CartModal = ({ handleClick, isOpen }: ModalProps) => {
  const { cart, removeProduct, updateQuantity, updateColorOrSize } = useCart();
  const [quantities, setQuantities] = useState<{ [id: string]: string }>({});

  // Inicializa os valores com o conteúdo do carrinho
  useEffect(() => {
    const initial = cart.reduce((acc, item) => {
      acc[item.id] = String(item.quantity);
      return acc;
    }, {} as { [id: string]: string });
    setQuantities(initial);
  }, [cart]);

  const calculateSubtotal = (product: ProdutoCart) => {
    const quantityStr = quantities[product.id] ?? "0";
    const quantity = parseInt(quantityStr, 10);
    return formatPrice(!isNaN(quantity) && quantity > 0 ? quantity * product.price : 0);
  };

  const handleInputChange = (id: string, value: string) => {
    if (/^\d*$/.test(value)) {
      setQuantities((prev) => ({ ...prev, [id]: value }));
      const parsed = parseInt(value, 10);
      updateQuantity(id, isNaN(parsed) ? 0 : parsed);
    }
  };

  const changeQuantity = (id: string, current: string, delta: number) => {
    const parsed = parseInt(current || "0", 10);
    const newQty = Math.max(parsed + delta, 0);
    setQuantities((prev) => ({ ...prev, [id]: String(newQty) }));
    updateQuantity(id, newQty);
  };

  const totalValue = cart.reduce((total, product) => {
    const quantity = parseInt(quantities[product.id] || "0", 10);
    return total + (isNaN(quantity) ? 0 : quantity * product.price);
  }, 0);

  return (
    <div className="ContainerModal h-full w-full">
      <div
        className={`h-[calc(h-screen-400px)] w-screen bg-black fixed inset-0 left-0 top-0 opacity-50 z-50 ${
          isOpen && cart.length > 0 ? "visible" : "hidden"
        }`}
        onClick={handleClick}
      ></div>
      <div
        className={`h-[100dvh] md:h-screen w-full md:w-[550px] 2xl:w-[576px] right-0 fixed bg-white z-50  p-1 flex flex-col items-start justify-start pt-2 transition-all duration-500  ${
          isOpen && cart.length > 0 ? "translate-x-0" : "translate-x-[100vw]"
        } `}
      >
        <X
          onClick={handleClick}
          className="text-xl lg:text-2xl text-red-600 absolute right-4 top-2 cursor-pointer hover:text-red-800 z-50"
        />
        <TitleSection
          text={`Meu Carrinho (${cart.length})`}
          icon={<ShoppingCart size={24} className="text-green-500" />}
        />
        <div className="containerProdutos w-full h-[83%] pb-18 mx-auto flex flex-col items-start justify-start p-4 overflow-x-hidden overflow-y-auto gap-4 scrollbar">
          {Array.isArray(cart) &&
            cart.map((product, index) => (
              <div key={product.codPro + index} className="w-full">
                <div className="flex flex-col sm:flex-row bg-white py-3 px-1 rounded-xl w-full items-start justify-start gap-2  relative bg-whiteReference">
                  <div className="w-20 h-20 overflow-hidden rounded-lg min-w-20 ml-4 shadow-lg">
                    <Image
                      src={product.images[0]}
                      width={150}
                      height={150}
                      alt={`Product image ${product.codPro}`}
                      className="h-full hover:rotate-12 transition-all hover:scale-125 duration-300 object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-2 px-4">
                    <p className="text-sm 2xl:text-lg font-Roboto text-blackReference">{product.productName}</p>

                    <div className="flex flex-col sm:flex-row items-start md:items-center gap-4">
                      <div className="flex items-center gap-2 text-sm md:text-base">
                        <p className="text-gray-500">Cor:</p>
                        {Array.isArray(product.cores) && (
                          <select
                            name="cor"
                            id="cor"
                            value={product.color} // valor atual selecionado
                            onChange={(e) => updateColorOrSize(product.id, e.target.value)}
                            className="border w-44 border-gray-400 uppercase rounded px-1 text-xs"
                          >
                            {product.cores.map((cor, i) => (
                              <option value={cor} key={i}>
                                {cor}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {product.size && (
                        <div className="flex items-center gap-2 text-sm md:text-base">
                          <p className="text-gray-500">Tamanho:</p>
                          {Array.isArray(product.tamanhos) && (
                            <select
                              name="tamanho"
                              id="tamanho"
                              value={product.size}
                              onChange={(e) => updateColorOrSize(product.id, e.target.value)}
                              className="border border-gray-400 uppercase rounded px-1 text-xs"
                            >
                              {product.tamanhos.map((tamanho, i) => (
                                <option value={tamanho} key={i}>
                                  {tamanho}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-end gap-4 flex-wrap">
                      <div className="flex flex-col items-start gap-2 mt-2">
                        <div className="flex items-center gap-2">
                          <button
                            className="w-6 h-6 flex justify-center items-center text-gray-600 cursor-pointer"
                            onClick={() => changeQuantity(product.id, quantities[product.id] ?? "0", -1)}
                          >
                            <Minus size={16} />
                          </button>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={quantities[product.id] ?? ""}
                            className="w-12 md:w-16 px-1 text-center rounded-md"
                            onChange={(e) => handleInputChange(product.id, e.target.value)}
                          />

                          <button
                            className="w-6 h-6 flex justify-center items-center text-gray-600 cursor-pointer"
                            onClick={() => changeQuantity(product.id, quantities[product.id] ?? "0", 1)}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-2">
                        <p className="text-sm">Subtotal: {calculateSubtotal(product)}</p>
                      </div>
                      {(!quantities[product.id] || parseInt(quantities[product.id]) <= 0) && (
                        <span className="text-red-500 text-xs">Digite uma quantidade mínima para prosseguir</span>
                      )}
                      <Trash2
                        size={20}
                        className="absolute right-1 md:right-2 bottom-4 cursor-pointer text-red-600 hover:text-red-800"
                        onClick={() => removeProduct(product.id)}
                      />
                    </div>
                  </div>
                </div>
                <hr className="border w-full text-gray-300" />
              </div>
            ))}
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-fit w-[98%] border-t-1 border-gray-500 p-2 flex flex-col items-start justify-start bg-white">
          <p className="font-medium text-sm md:text-base">Total de itens: {cart.length} produtos</p>
          <p className="font-medium text-sm md:text-base">
            Valor Total:
            <span className="font-semibold pl-1 text-sm md:text-base">{formatPrice(totalValue)}</span>
          </p>
          <p className="text-xs">*Frete não incluso</p>
          <div className="flex w-full flex-col-reverse sm:flex-row gap-2 mt-1 justify-center md:justify-end">
            <Button
              onClick={handleClick}
              className="w-full sm:w-fit cursor-pointer text-xs md:text-sm bg-Button-bg hover:bg-Button-bgHover hover:text-Button-textHover hover:border-Button-borderHover border rounded-md text-Button-text px-4 py-2"
            >
              Continuar Comprando
            </Button>
            <Link href={"/entrega"}>
              <Button
                className="w-full sm:w-fit cursor-pointer text-xs md:text-sm bg-green-500 hover:bg-green-400 rounded-md text-Button-text px-4 py-2"
                onClick={handleClick}
              >
                Finalizar Compra
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
