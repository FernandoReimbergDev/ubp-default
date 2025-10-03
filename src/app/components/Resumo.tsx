"use client";

import { useCart } from "@/app/Context/CartContext";
import { formatPrice } from "@/app/utils/formatter";
import { FileSearch2, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface ResumoProps {
  selectedPaymentTotal?: number;
  selectedPaymentMethod?: string;
  selectedInstallments?: number;
}

export function Resumo({ selectedPaymentTotal, selectedPaymentMethod, selectedInstallments }: ResumoProps) {
  const { cart } = useCart();
  const [quantities, setQuantities] = useState<{ [id: string]: string }>({});
  const [valorFrete, setValorFrete] = useState(0);
  useEffect(() => {
    const initial = cart.reduce((acc, item) => {
      acc[item.id] = String(item.quantity);
      return acc;
    }, {} as { [id: string]: string });
    setQuantities(initial);
    setValorFrete(58.9);
  }, [cart]);

  const totalValue = cart.reduce((total, product) => {
    const quantity = parseInt(quantities[product.id] || "0", 10);
    return total + (isNaN(quantity) ? 0 : quantity * product.price);
  }, 0);

  // Determinar o valor total a prazo baseado na seleção
  const getTotalAPrazo = () => {
    if (selectedPaymentTotal && selectedPaymentMethod) {
      return selectedPaymentTotal;
    }
    return totalValue + valorFrete;
  };

  const getTotalAPrazoText = () => {
    if (selectedPaymentMethod === "credit" && selectedInstallments) {
      if (selectedInstallments === 1) {
        return "(à vista no crédito)";
      } else {
        return `(em ${selectedInstallments}x com juros)`;
      }
    } else if (selectedPaymentMethod === "boleto") {
      return "(boleto à vista)";
    }
    return `(em até 10x de ${formatPrice((totalValue + valorFrete) / 10)}) sem juros`;
  };

  return (
    <div className="space-y-4">
      <h2 className="flex gap-1 items-center text-lg font-semibold text-primary">
        <FileSearch2 size={18} />
        Resumo
      </h2>

      <div className="w-full flex justify-between items-center">
        <p>Valor dos Produtos:</p>
        <span>{formatPrice(totalValue)}</span>
      </div>

      <div className="w-full flex justify-between items-center">
        <p>Valor do Frete:</p>
        <span>{formatPrice(valorFrete)}</span>
      </div>

      <hr className="text-gray-300" />

      <div>
        <div className="bg-gray-200 flex justify-between items-center px-2 py-4">
          <p className="text-sm">Total a prazo:</p>
          <span>{formatPrice(getTotalAPrazo())}</span>
        </div>
        <span className="text-xs w-full flex justify-end mt-2">{getTotalAPrazoText()}</span>
      </div>

      <hr className="text-gray-300" />

      <div>
        <div className="bg-green-300 flex justify-between items-center px-2 py-4">
          <p className="text-sm">Valor à vista:</p>
          <span>{formatPrice(totalValue + valorFrete)}</span>
        </div>
      </div>

      <hr className="text-gray-300" />

      <h2 className="flex gap-1 items-center text-lg font-semibold text-primary">
        <ShoppingCart size={18} />
        Produtos
      </h2>

      <div className="w-full h-[310px] scrollbar overflow-x-hidden overflow-y-auto flex flex-col justify-start">
        {Array.isArray(cart) &&
          cart.map((product, index) => (
            <div key={product.codPro + index} className="w-full">
              <div className="flex bg-white py-3 px-1 rounded-xl w-full items-start justify-start gap-2 relative bg-whiteReference">
                <div className="w-16 h-16 overflow-hidden rounded-lg min-w-16 shadow-lg flex justify-center items-center">
                  <Image
                    src={product.images[0]}
                    width={70}
                    height={70}
                    alt={`Product image ${product.codPro}`}
                    className="h-full object-cover"
                  />
                </div>

                <div className="flex flex-col gap-1 px-2">
                  <p className="text-xs 2xl:text-sm font-Roboto text-blackReference truncate overflow-hidden text-ellipsis max-w-48">
                    {product.productName}
                  </p>

                  <div className="flex items-start gap-2 text-xs">
                    <p className="text-gray-500">Quantidade:</p>
                    <p>{product.quantity}</p>
                  </div>

                  <div className="flex items-start gap-2 text-xs">
                    <p className="text-gray-500">Cor:</p>
                    <p>{product.color}</p>
                  </div>

                  {product.size && (
                    <div className="flex items-center gap-2 text-xs">
                      <p className="text-gray-500">Tamanho:</p>
                      <p>{product.size}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs">{formatPrice(product.subtotal)}</div>
                </div>
              </div>

              <hr className="border w-full text-gray-300" />
            </div>
          ))}
      </div>
    </div>
  );
}
