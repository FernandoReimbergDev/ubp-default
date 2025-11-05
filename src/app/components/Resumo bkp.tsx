"use client";

import { useCart } from "@/app/Context/CartContext";
import { formatPrice } from "@/app/utils/formatter";
import { FileSearch2, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useMemo, useEffect, useState } from "react";
import { getPackageVolumeAndWeight } from "@/app/services/mountVolume";
import Cookies from "js-cookie";

interface ResumoProps {
  delivery: {
    stateCode: string | undefined;
    city: string | undefined;
    zipCode: string | undefined;
  }
}

export function Resumo({ delivery }: ResumoProps) {
  const { cart, fetchProductFrete, cartReady } = useCart();
  const [valorFrete, setValorFrete] = useState<number | undefined>(undefined);
  const [loadingFrete, setLoadingFrete] = useState(false);
  const [freteErro, setFreteErro] = useState<string | null>(null);

  // console.log("teste resumo", selectedPaymentTotal, selectedPaymentMethod, selectedInstallments)

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

  const deliveryReady = useMemo(() => {
    const zip = (delivery?.zipCode || "").replace(/\D/g, "");
    const uf = (delivery?.stateCode || "").trim();
    const city = (delivery?.city || "").trim();
    const ready = Boolean(zip.length === 8 && uf && city);
    return { ready, zip, uf, city };
  }, [delivery]);

  // Consulta frete quando carrinho ou delivery mudarem
  useEffect(() => {
    // Aguarda hidratação do carrinho antes de qualquer ação
    if (!cartReady) {
      setLoadingFrete(true);
      return;
    }

    if (!deliveryReady.ready) {
      console.debug("[Resumo] delivery incompleto, pulando consulta.", deliveryReady);
      setFreteErro(null);
      setValorFrete(undefined);
      try { Cookies.remove("valorFrete"); } catch { }
      return;
    }
    if (!cart?.length) {
      console.debug("[Resumo] carrinho vazio, pulando consulta.");
      setFreteErro(null);
      setValorFrete(undefined);
      try { Cookies.remove("valorFrete"); } catch { }
      return;
    }

    // Normalizações: unidades esperadas pela API
    // pesoTotal (g) -> kg com mínimo 0.05kg
    const pesoKg = Math.max(((pkg?.pesoTotal ?? 0) as number) / 1000, 0.05);
    const altura = Math.max((pkg?.altura ?? 0) as number, 1);
    const largura = Math.max((pkg?.largura ?? 0) as number, 1);
    const comprimento = Math.max((pkg?.comprimento ?? 0) as number, 1);

    console.debug("[Resumo] Disparando frete", {
      purchaseAmount: totalValue.toFixed(2),
      stateCode: deliveryReady.uf,
      city: deliveryReady.city,
      zipCode: deliveryReady.zip,
      weightKg: pesoKg.toFixed(2),
      altura,
      largura,
      comprimento,
    });

    const ac = new AbortController();
    setLoadingFrete(true);
    setFreteErro(null);

    fetchProductFrete(
      totalValue.toFixed(2),
      deliveryReady.uf,
      deliveryReady.city,
      deliveryReady.zip,
      pesoKg.toFixed(2),
      altura.toString(),
      largura.toString(),
      comprimento.toString(),
      ac.signal
    )
      .then((amount) => {
        console.log("[Resumo] consultaFrete result:", amount);
        const valid = typeof amount === "number" && Number.isFinite(amount);
        setValorFrete(valid ? amount : undefined);
        try {
          if (valid) {
            Cookies.set("valorFrete", String(amount), { sameSite: "Lax" });
          } else {
            Cookies.remove("valorFrete");
          }
        } catch { }
        if (!valid) setFreteErro("Não foi possível calcular o frete agora.");
      })
      .catch((e) => {
        console.warn("[Resumo] consultaFrete erro:", e);
        setFreteErro("Falha ao consultar frete.");
        setValorFrete(undefined);
        try { Cookies.remove("valorFrete"); } catch { }
      })
      .finally(() => setLoadingFrete(false));

    return () => ac.abort();
  }, [
    cartReady,
    cart?.length,
    quantities, // muda com quantidades por item
    deliveryReady.zip,
    deliveryReady.uf,
    deliveryReady.city,
    totalValue,
    pkg?.pesoTotal,
    pkg?.altura,
    pkg?.largura,
    pkg?.comprimento,
    fetchProductFrete,
  ]);

  // Determinar o valor total a prazo baseado na seleção
  // const getTotalAPrazo = () => {
  //   if (selectedPaymentTotal && selectedPaymentMethod) {
  //     return selectedPaymentTotal;
  //   }
  //   return totalValue + (Number.isFinite(Number(valorFrete)) ? Number(valorFrete) : 0);
  // };

  // const getTotalAPrazoText = () => {
  //   if (selectedPaymentMethod === "credit" && selectedInstallments) {
  //     if (selectedInstallments === 1) {
  //       return "(à vista no crédito)";
  //     } else {
  //       return `(em ${selectedInstallments}x com juros)`;
  //     }
  //   } else if (selectedPaymentMethod === "boleto") {
  //     return "(boleto à vista)";
  //   }
  //   return `(em até 10x de ${formatPrice((totalValue + Number(valorFrete)) / 10)}) sem juros`;
  // };

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
        <span>{loadingFrete ? "Calculando..." : freteErro ? "—" : formatPrice(Number(valorFrete) || 0)}</span>
      </div>

      <hr className="text-gray-300" />
      {/* 
      <div>
        <div className="bg-gray-200 flex justify-between items-center px-2 py-4">
          <p className="text-sm">Total a prazo:</p>
          <span>{formatPrice(getTotalAPrazo())}</span>
        </div>
        <span className="text-xs w-full flex justify-end mt-2">{getTotalAPrazoText()}</span>
      </div>

      <hr className="text-gray-300" /> */}

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
                  <div className="flex items-center gap-2 text-xs">Subtotal: {formatPrice(product.subtotal)} (valor und.: {formatPrice(product.price)})</div>
                </div>
              </div>

              <hr className="border w-full text-gray-300" />
            </div>
          ))}
      </div>
    </div>
  );
}
