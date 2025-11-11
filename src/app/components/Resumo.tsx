/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useCart } from "@/app/Context/CartContext";
import { formatPrice } from "@/app/utils/formatter";
import { FileSearch2, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useMemo, useEffect, useRef, useState, useCallback } from "react";
import { getPackageVolumeAndWeight } from "@/app/services/mountVolume";
import Cookies from "js-cookie";

interface ResumoProps {
  delivery: { stateCode: string; city: string; zipCode: string };
}

const toNumber = (v: number | string | undefined | null) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v !== "string") return 0;

  const s = v.trim();
  if (!s) return 0;

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  let normalized = s;

  if (hasComma && hasDot) {
    // Ex.: "1.234,56" → remove pontos (milhar) e troca vírgula por ponto
    normalized = s.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    // Ex.: "18,24" → vírgula como decimal
    normalized = s.replace(",", ".");
  } else {
    // Ex.: "18.24" → ponto como decimal (não remova!)
    normalized = s;
  }

  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
};


export function Resumo({ delivery }: ResumoProps) {
  const { cart, fetchProductFrete, cartReady } = useCart();

  const [valorFrete, setValorFrete] = useState<number | string | undefined>(undefined);
  const [loadingFrete, setLoadingFrete] = useState(false);
  const [freteErro, setFreteErro] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const lastKeyRef = useRef<string>("");

  // Quantidades e total
  const quantities = useMemo(() => {
    return cart.reduce((acc, item) => {
      acc[item.id] = String(item.quantity);
      return acc;
    }, {} as Record<string, string>);
  }, [cart]);

  const totalValue = useMemo(() => {
    return cart.reduce((total, product) => {
      const q = parseInt(quantities[product.id] || "0", 10);
      return total + (isNaN(q) ? 0 : q * product.unitPriceEffective);
    }, 0);
  }, [cart, quantities]);

  // Pacote
  const pkg = useMemo(() => {
    const itemsWithStringDims = cart.map((item) => ({
      ...item,
      altura: item.altura?.toString(),
      largura: item.largura?.toString(),
      comprimento: item.comprimento?.toString(),
      peso: item.peso?.toString(),
    }));
    return getPackageVolumeAndWeight(itemsWithStringDims, quantities);
  }, [cart, quantities]);

  // Delivery pronto
  const deliveryReady = useMemo(() => {
    const zip = (delivery?.zipCode || "").replace(/\D/g, "");
    const uf = (delivery?.stateCode || "").trim();
    const city = (delivery?.city || "").trim();
    return { ready: Boolean(zip.length === 8 && uf && city), zip, uf, city };
  }, [delivery]);

  // Normaliza parâmetros
  const norm = useMemo(() => {
    const pesoKg = Math.max(pkg?.pesoTotal ?? 0, 0);
    const altura = Math.max(pkg?.altura ?? 0, 0);
    const largura = Math.max(pkg?.largura ?? 0, 0);
    const comprimento = Math.max(pkg?.comprimento ?? 0, 0);
    return {
      purchaseAmount: totalValue.toFixed(2),
      uf: deliveryReady.uf,
      city: deliveryReady.city,
      zip: deliveryReady.zip,
      weightKg: pesoKg.toFixed(2),
      altura: String(altura),
      largura: String(largura),
      comprimento: String(comprimento),
    };
  }, [
    pkg?.pesoTotal,
    pkg?.altura,
    pkg?.largura,
    pkg?.comprimento,
    totalValue,
    deliveryReady.uf,
    deliveryReady.city,
    deliveryReady.zip,
  ]);

  // Chave do frete
  const freteKey = useMemo(() => {
    const ids = cart.map((p) => `${p.id}:${quantities[p.id]}`).sort().join("|");
    return [
      norm.purchaseAmount,
      norm.uf,
      norm.city,
      norm.zip,
      norm.weightKg,
      norm.altura,
      norm.largura,
      norm.comprimento,
      ids,
    ].join("#");
  }, [cart, quantities, norm]);

  // Consulta com retry
  const runFrete = useCallback(
    async (key: string) => {
      if (!cartReady || !deliveryReady.ready || !cart?.length) return;
      if (lastKeyRef.current === key) return;        // evita duplicata
      lastKeyRef.current = key;                      // marca a chave

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const reqId = ++requestIdRef.current;

      try {
        setLoadingFrete(true);
        setFreteErro(null);

        const call = async () =>
          fetchProductFrete?.(
            norm.purchaseAmount,
            norm.uf,
            norm.city,
            norm.zip,
            norm.weightKg,
            norm.altura,
            norm.largura,
            norm.comprimento,
            // se o service aceitar, passe { signal: controller.signal }
          );

        let amount: number | undefined;
        if (Number(norm.purchaseAmount) > 1500) {
          amount = 0;
        } else {
          try {
            amount = await call();
          } catch {
            await new Promise((r) => setTimeout(r, 400));
            amount = await call();
          }
        }

        setValorFrete(Number(totalValue) > 1500 ? 0 : amount);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setFreteErro("Falha ao consultar frete.");
        lastKeyRef.current = ""; // libera para tentar de novo
        try { Cookies.remove("valorFrete"); } catch { }
      } finally {
        if (reqId === requestIdRef.current) setLoadingFrete(false);
      }
    },
    [cartReady, deliveryReady.ready, cart?.length, fetchProductFrete, norm, totalValue]
  );

  // Disparo estável (evita corrida em prod)
  const canFetchFrete =
    cartReady && deliveryReady.ready && (cart?.length ?? 0) > 0 && Boolean(freteKey);

  useEffect(() => {
    if (!canFetchFrete) return;
    const id = setTimeout(() => runFrete(freteKey), 0);
    return () => {
      clearTimeout(id);
      abortRef.current?.abort();
    };
  }, [canFetchFrete, freteKey, runFrete]);

  // Persistência do valor no cookie
  useEffect(() => {
    if (valorFrete !== undefined) {
      try {
        Cookies.set("valorFrete", String(valorFrete), { expires: 1 });
      } catch { }
    }
  }, [valorFrete]);

  const freteNum = toNumber(valorFrete);
  const totalGeral = totalValue + freteNum;

  return (
    <div className="space-y-4 w-full">
      <h2 className="flex gap-1 items-center text-lg font-semibold text-primary mt-2 lg:mt-0">
        <FileSearch2 size={18} />
        Resumo
      </h2>

      <div className="w-full flex justify-between items-center">
        <p>Valor dos Produtos:</p>
        <span>{formatPrice(totalValue)}</span>
      </div>

      <div className="w-full flex justify-between items-center">
        <p>Valor do Frete:</p>
        <span
          className={
            freteNum === 0 && !loadingFrete && !freteErro
              ? "px-2 py-0.5 rounded bg-green-100 text-green-700"
              : ""
          }
        >
          {loadingFrete
            ? "Calculando..."
            : freteErro
              ? "Indisponível"
              : formatPrice(freteNum)}
        </span>
      </div>

      {freteNum === 0 && !loadingFrete && !freteErro && (
        <p className="text-[11px] text-green-700">* Frete gratuito para compras acima de R$ 1.500,00</p>
      )}

      <hr className="text-gray-300" />

      <div>
        <div className="bg-green-300 flex justify-between items-center px-2 py-4">
          <p className="text-sm">Valor Total:</p>
          <span>{loadingFrete ? "—" : formatPrice(totalGeral)}</span>
        </div>
      </div>

      <hr className="text-gray-300" />

      <h2 className="flex gap-1 items-center text-lg font-semibold text-primary">
        <ShoppingCart size={18} />
        Produtos
      </h2>

      <div className="w-full h-[310px] scrollbar overflow-x-hidden overflow-y-auto flex flex-col justify-start">
        {Array.isArray(cart) &&
          cart.map((product) => (
            <div key={product.id} className="w-full">
              <div className="flex bg-white py-3 px-1 rounded-xl w-full items-start gap-2 relative bg-whiteReference">
                <div className="w-16 h-16 overflow-hidden rounded-lg min-w-16 shadow-lg flex justify-center items-center">
                  {product.thumb ? (
                    <Image
                      src={product.thumb}
                      width={70}
                      height={70}
                      alt={product.alt || product.productName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="w-[70px] h-[70px] flex items-center justify-center text-[10px] bg-gray-100 text-gray-500">
                      sem imagem
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1 px-2">
                  <p className="text-xs 2xl:text-sm font-Roboto text-blackReference line-clamp-2 overflow-hidden w-full">
                    {product.productName}
                  </p>

                  {product.hasPersonalization && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] uppercase bg-blue-600 text-white px-2 py-0.5 rounded">
                        Personalizado
                      </span>
                    </div>
                  )}

                  <div className="flex items-start gap-2 text-xs">
                    <p className="text-gray-500">Quantidade:</p>
                    <p>{product.quantity}</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    valor produto: {formatPrice(product.unitPriceEffective)}
                  </div>

                  <div className="flex items-start gap-2 text-xs">
                    <p className="text-gray-500">Cor:</p>
                    <p>{product.color || "-"}</p>
                  </div>

                  {product.size && (
                    <div className="flex items-center gap-2 text-xs">
                      <p className="text-gray-500">Tamanho:</p>
                      <p>{product.size}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs">
                    Subtotal: {formatPrice(product.quantity * product.unitPriceEffective)}
                  </div>
                </div>
              </div>

              <hr className="border w-full text-gray-300" />
            </div>
          ))}
      </div>
    </div>
  );
}
