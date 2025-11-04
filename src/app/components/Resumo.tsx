"use client";

import { useCart } from "@/app/Context/CartContext";
import { formatPrice } from "@/app/utils/formatter";
import { FileSearch2, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useMemo, useEffect, useState } from "react";
import { getPackageVolumeAndWeight } from "@/app/services/mountVolume";

interface ResumoProps {
  selectedPaymentTotal?: number;
  selectedPaymentMethod?: string;
  selectedInstallments?: number;
  delivery: {
    stateCode: string;
    city: string;
    zipCode: string;
  }
}

export function Resumo({ selectedPaymentTotal, selectedPaymentMethod, selectedInstallments, delivery }: ResumoProps) {
  const { cart, fetchProductFrete } = useCart();
  const [valorFrete, setValorFrete] = useState<number | undefined>(undefined);

  const quantities = useMemo(() => {
    return cart.reduce((acc, item) => {
      acc[item.id] = String(item.quantity);
      return acc;
    }, {} as Record<string, string>);
  }, [cart]);

  const totalValue = useMemo(() => {
    return cart.reduce((total, product) => {
      const q = parseInt(quantities[product.id] || "0", 10);
      return total + (isNaN(q) ? 0 : q * product.price);
    }, 0);
  }, [cart, quantities]);

  const pkg = useMemo(() => getPackageVolumeAndWeight(cart, quantities), [cart, quantities]);


  useEffect(() => {
    console.log(pkg.volumeTotal, pkg.pesoTotal, pkg.altura, pkg.largura, pkg.comprimento);
  }, [pkg]);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const amount = await fetchProductFrete(
          String(totalValue),
          delivery.stateCode,
          delivery.city,
          delivery.zipCode,
          String(pkg.pesoTotal),
          String(pkg.altura),
          String(pkg.largura),
          String(pkg.comprimento),
          controller.signal
        );
        setValorFrete(amount);
      } catch {
        setValorFrete(undefined);
      }
    })();
    return () => controller.abort();
  }, [fetchProductFrete, totalValue, pkg]);

  // Determinar o valor total a prazo baseado na seleção
  const getTotalAPrazo = () => {
    if (selectedPaymentTotal && selectedPaymentMethod) {
      return selectedPaymentTotal;
    }
    return totalValue + Number(valorFrete);
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
    return `(em até 10x de ${formatPrice((totalValue + Number(valorFrete)) / 10)}) sem juros`;
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
        <span>{formatPrice(Number(valorFrete))}</span>
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
          <span>{formatPrice(totalValue + Number(valorFrete))}</span>
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
                  <p className="text-xs 2xl:text-sm font-Roboto text-blackReference line-clamp-2 overflow-hidden w-full">
                    {product.productName}
                  </p>

                  {product.personalization && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] uppercase bg-blue-600 text-white px-2 py-0.5 rounded">Personalizado</span>
                    </div>
                  )}

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
