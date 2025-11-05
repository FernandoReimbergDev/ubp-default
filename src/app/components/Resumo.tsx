"use client";

import { useCart } from "@/app/Context/CartContext";
import { formatPrice } from "@/app/utils/formatter";
import { FileSearch2, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useMemo, useEffect, useRef, useState, useCallback } from "react";
import { getPackageVolumeAndWeight } from "@/app/services/mountVolume";
import Cookies from "js-cookie";

interface ResumoProps {
  delivery: { stateCode: string; city: string; zipCode: string; };
}

export function Resumo({ delivery }: ResumoProps) {
  const { cart, fetchProductFrete, cartReady } = useCart();

  const [valorFrete, setValorFrete] = useState<number | undefined>(undefined);
  const [loadingFrete, setLoadingFrete] = useState(false);
  const [freteErro, setFreteErro] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const lastKeyRef = useRef<string>("");

  // 1) Quantidades e total
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

  // 2) Pacote
  const pkg = useMemo(() => getPackageVolumeAndWeight(cart, quantities), [cart, quantities]);

  // 3) Delivery Ready
  const deliveryReady = useMemo(() => {
    const zip = (delivery?.zipCode || "").replace(/\D/g, "");
    const uf = (delivery?.stateCode || "").trim();
    const city = (delivery?.city || "").trim();
    return { ready: Boolean(zip.length === 8 && uf && city), zip, uf, city };
  }, [delivery]);

  // 4) Pré-carrega valor do cookie (UX melhor)
  useEffect(() => {
    try {
      const saved = Cookies.get("valorFrete");
      if (saved) {
        const n = Number(saved);
        if (Number.isFinite(n)) setValorFrete(n);
      }
    } catch { }
  }, []);

  // 5) Monta parâmetros normalizados
  const norm = useMemo(() => {
    // peso (g) -> kg (mín. 0.05)
    const pesoKg = Math.max(((pkg?.pesoTotal ?? 0) as number) / 1000, 0.05);
    const altura = Math.max((pkg?.altura ?? 0) as number, 1);
    const largura = Math.max((pkg?.largura ?? 0) as number, 1);
    const comprimento = Math.max((pkg?.comprimento ?? 0) as number, 1);
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
  }, [pkg?.pesoTotal, pkg?.altura, pkg?.largura, pkg?.comprimento, totalValue, deliveryReady.uf, deliveryReady.city, deliveryReady.zip]);

  // 6) Chave única do frete (dispara quando muda)
  const freteKey = useMemo(() => {
    const ids = cart.map(p => `${p.id}:${quantities[p.id]}`).sort().join("|");
    return [
      norm.purchaseAmount, norm.uf, norm.city, norm.zip,
      norm.weightKg, norm.altura, norm.largura, norm.comprimento,
      ids
    ].join("#");
  }, [cart, quantities, norm]);

  // 7) Função estável para consultar frete
  const runFrete = useCallback(async (key: string) => {
    // evita chamadas com inputs incompletos
    if (!cartReady) return;
    if (!deliveryReady.ready) return;
    if (!cart?.length) return;

    // evita repetição se a mesma key já foi resolvida
    if (lastKeyRef.current === key) return;

    // aborta requisição anterior
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // request id para resolver race
    const reqId = ++requestIdRef.current;

    try {
      setLoadingFrete(true);
      setFreteErro(null);

      // (opcional) debug:
      // console.debug("[Resumo] disparando frete", norm);

      const call = async () =>
        fetchProductFrete(
          norm.purchaseAmount,
          norm.uf,
          norm.city,
          norm.zip,
          norm.weightKg,
          norm.altura,
          norm.largura,
          norm.comprimento,
          controller.signal
        );

      let amount = await call().catch(async (e: any) => {
        // retry simples pós 500/429 (depende de como fetchProductFrete propaga)
        await new Promise(r => setTimeout(r, 400));
        return call();
      });

      // ignora respostas tardias
      if (reqId !== requestIdRef.current) return;

      const valid = typeof amount === "number" && Number.isFinite(amount);
      if (!valid) {
        setValorFrete(undefined);
        setFreteErro("Não foi possível calcular o frete agora.");
        try { Cookies.remove("valorFrete"); } catch { }
      } else {
        setValorFrete(amount);
        setFreteErro(null);
        lastKeyRef.current = key; // marca que essa key já foi resolvida
        try { Cookies.set("valorFrete", String(amount), { sameSite: "Lax" }); } catch { }
      }
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setValorFrete(undefined);
      setFreteErro("Falha ao consultar frete.");
      try { Cookies.remove("valorFrete"); } catch { }
    } finally {
      if (reqId === requestIdRef.current) setLoadingFrete(false);
    }
  }, [cartReady, deliveryReady.ready, cart?.length, fetchProductFrete, norm]);

  // 8) Dispara automaticamente quando a key muda e tudo está pronto
  useEffect(() => {
    if (!cartReady) return;
    if (!deliveryReady.ready) return;
    if (!cart?.length) return;
    if (!freteKey) return;

    runFrete(freteKey);

    return () => {
      // aborta apenas se for a mesma chamada em voo
      if (abortRef.current) abortRef.current.abort();
    };
  }, [cartReady, deliveryReady.ready, cart?.length, freteKey, runFrete]);

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
        <span>
          {loadingFrete ? "Calculando..." : freteErro ? "—" : formatPrice(Number(valorFrete) || 0)}
        </span>
      </div>

      <hr className="text-gray-300" />

      <div>
        <div className="bg-green-300 flex justify-between items-center px-2 py-4">
          <p className="text-sm">Valor à vista:</p>
          <span>{formatPrice(totalValue + Number(valorFrete || 0))}</span>
        </div>
      </div>

      <hr className="text-gray-300" />

      <h2 className="flex gap-1 items-center text-lg font-semibold text-primary">
        <ShoppingCart size={18} />
        Produtos
      </h2>

      <div className="w-full h-[310px] scrollbar overflow-x-hidden overflow-y-auto flex flex-col justify-start">
        {Array.isArray(cart) && cart.map((product, index) => (
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
                    <span className="text-[10px] uppercase bg-blue-600 text-white px-2 py-0.5 rounded">
                      Personalizado
                    </span>
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
                <div className="flex items-center gap-2 text-xs">
                  Subtotal: {formatPrice(product.subtotal)} (valor und.: {formatPrice(product.price)})
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
