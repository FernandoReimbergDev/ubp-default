"use client";
import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCart } from "../Context/CartContext";
import type { CartItemPersist } from "../types/cart";
import type { ProdutoEstoqueItem } from "../types/responseTypes";
import { formatPrice } from "../utils/formatter";
import { Button } from "./Button";
import { TitleSection } from "./TitleSection";

interface ModalProps {
  handleClick?: (
    event: React.MouseEvent<HTMLButtonElement | SVGSVGElement | HTMLDivElement, MouseEvent>
  ) => void;
  isOpen: boolean;
}

// tempos configuráveis
const DEBOUNCE_MS = 900;         // pausa de digitação antes de consultar
const REQUEST_TIMEOUT_MS = 8000; // abort da request

export const CartModal = ({ handleClick, isOpen }: ModalProps) => {
  const { cart, removeProduct, updateQuantity } = useCart();
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [stockByItem, setStockByItem] = useState<Record<string, ProdutoEstoqueItem | undefined>>({});
  const [loadingByItem, setLoadingByItem] = useState<Record<string, boolean>>({});

  // Controle por item: debounce, abort e requestId
  const fetchDebounceRef = useRef<Record<string, ReturnType<typeof setTimeout> | null>>({});
  const fetchAbortRef = useRef<Record<string, AbortController | null>>({});
  const requestIdRef = useRef<Record<string, number>>({});
  const fetchTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout> | null>>({});

  const toNumberBR = (val: string | number | undefined) => {
    if (val === undefined || val === null) return undefined;
    const s = String(val).trim();
    if (s === "") return undefined;
    if (s.includes(".") && s.includes(",")) return Number(s.replace(/\./g, "").replace(",", "."));
    if (s.includes(",")) return Number(s.replace(",", "."));
    return Number(s);
  };

  const getAggregatedRequestedForPool = useCallback(
    (base: CartItemPersist) => {
      return cart.reduce((sum, it) => {
        const samePool =
          it.chavePro === base.chavePro &&
          (it.color || "") === (base.color || "") &&
          (it.size || "") === (base.size || "");
        if (!samePool) return sum;
        const q = parseInt(quantities[it.id] || "0", 10);
        return sum + (isNaN(q) ? 0 : q);
      }, 0);
    },
    [cart, quantities]
  );

  // Inicializa os valores com o conteúdo do carrinho
  useEffect(() => {
    const initial = cart.reduce<Record<string, string>>((acc, item) => {
      acc[item.id] = String(item.quantity);
      return acc;
    }, {});
    setQuantities(initial);
  }, [cart]);

  const calculateSubtotal = (product: CartItemPersist) => {
    const quantityStr = quantities[product.id] ?? "0";
    const quantity = parseInt(quantityStr, 10);
    if (isNaN(quantity) || quantity <= 0) return formatPrice(0);
    return formatPrice(quantity * product.unitPriceEffective);
  };

  const handleInputChange = (id: string, value: string) => {
    if (/^\d*$/.test(value)) {
      setQuantities((prev) => ({ ...prev, [id]: value }));
      const parsed = parseInt(value, 10);
      // updateQuantity agora espera number
      updateQuantity(id, isNaN(parsed) ? 0 : parsed);
      const item = cart.find((p) => p.id === id);
      if (item) scheduleFetch(item); // só dispara após a pausa
    }
  };

  const changeQuantity = (id: string, current: string, delta: number) => {
    const parsed = parseInt(current || "0", 10);
    const newQty = Math.max(parsed + delta, 0);
    setQuantities((prev) => ({ ...prev, [id]: String(newQty) }));
    updateQuantity(id, newQty);
    const item = cart.find((p) => p.id === id);
    if (item) scheduleFetch(item);
  };

  const totalValue = cart.reduce((total, product) => {
    const quantity = parseInt(quantities[product.id] || "0", 10);
    if (isNaN(quantity) || quantity <= 0) return total;
    return total + quantity * product.unitPriceEffective;
  }, 0);

  const hasInvalidQuantities = cart.some((item) => {
    const availableNum = toNumberBR(stockByItem[item.id]?.quantidadeSaldo);
    const available =
      typeof availableNum === "number" && isFinite(availableNum) ? Math.trunc(availableNum) : undefined;
    if (typeof available !== "number") return false;
    const aggregatedRequested = getAggregatedRequestedForPool(item);
    return aggregatedRequested > available;
  });

  const fetchItemStock = useCallback(
    async (item: CartItemPersist, signal?: AbortSignal, reqId?: number) => {
      if (!item.chavePro) {
        setStockByItem((prev) => ({ ...prev, [item.id]: undefined }));
        return;
      }
      setLoadingByItem((prev) => ({ ...prev, [item.id]: true }));
      try {
        const doRequest = async () => {
          const res = await fetch("/api/stock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              codPro: item.codPro,
              chavePro: item.chavePro,
              ...(item.color ? { descrProCor: item.color } : {}),
              ...(item.size ? { descrProTamanho: item.size } : {}),
            }),
            signal,
          });
          return res;
        };

        let res = await doRequest();
        if (!res.ok && (res.status === 429 || res.status >= 500)) {
          res = await doRequest();
        }

        const result: {
          success: boolean;
          data?: {
            success: boolean;
            message: string;
            result: { produtos: ProdutoEstoqueItem[] } | ProdutoEstoqueItem[];
          };
          message?: string;
          details?: unknown;
        } = await res.json();

        if (!res.ok) {
          const detailsStr = typeof result.details === "string" ? result.details : undefined;
          if (detailsStr === "Estoque não encontrado com os parâmetro(s) fornecido(s).") {
            setStockByItem((prev) => ({ ...prev, [item.id]: undefined }));
            return;
          }
          throw new Error(result.message || "Erro ao buscar produtos");
        }

        const raw = result.data?.result as unknown;
        const produtos: ProdutoEstoqueItem[] = Array.isArray(raw)
          ? (raw as ProdutoEstoqueItem[])
          : ((raw as { produtos?: ProdutoEstoqueItem[] })?.produtos ?? []);
        const first = produtos?.[0];

        if (reqId === requestIdRef.current[item.id]) {
          setStockByItem((prev) => ({ ...prev, [item.id]: first }));
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          if (reqId === requestIdRef.current[item.id]) {
            setLoadingByItem((prev) => ({ ...prev, [item.id]: false }));
          }
          return;
        }
        console.error("erro ao requisitar produtos para api externa", error);
        if (reqId === requestIdRef.current[item.id]) {
          setStockByItem((prev) => ({ ...prev, [item.id]: undefined }));
        }
      } finally {
        if (reqId === requestIdRef.current[item.id]) {
          if (fetchTimeoutRef.current[item.id]) {
            clearTimeout(fetchTimeoutRef.current[item.id]!);
            fetchTimeoutRef.current[item.id] = null;
          }
          setLoadingByItem((prev) => ({ ...prev, [item.id]: false }));
        }
      }
    },
    []
  );

  // Agenda consulta com debounce e cancelamento por item
  const scheduleFetch = useCallback(
    (item: CartItemPersist, delayMs = DEBOUNCE_MS) => {
      const id = item.id;
      const requested = parseInt(quantities[id] || "0", 10);

      if (!(requested > 0)) return;

      if (fetchDebounceRef.current[id]) clearTimeout(fetchDebounceRef.current[id]!);

      fetchDebounceRef.current[id] = setTimeout(() => {
        if (fetchAbortRef.current[id]) {
          try { fetchAbortRef.current[id]!.abort(); } catch { }
        }

        const current = requestIdRef.current[id] ?? 0;
        const nextId = current + 1;
        requestIdRef.current[id] = nextId;

        const controller = new AbortController();
        fetchAbortRef.current[id] = controller;

        if (fetchTimeoutRef.current[id]) clearTimeout(fetchTimeoutRef.current[id]!);
        fetchTimeoutRef.current[id] = setTimeout(() => {
          try { controller.abort(); } catch { }
        }, REQUEST_TIMEOUT_MS);

        setLoadingByItem((prev) => ({ ...prev, [id]: true }));

        fetchItemStock(item, controller.signal, nextId);
      }, delayMs);
    },
    [fetchItemStock, quantities]
  );

  // Inicial: carregar estoque para os itens ao abrir/alterar lista (com escalonamento leve)
  useEffect(() => {
    cart.forEach((item, i) => {
      scheduleFetch(item, Math.min(200 + i * 100, 800));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart]);

  // Cleanup geral
  useEffect(() => {
    const debounces = fetchDebounceRef.current;
    const aborts = fetchAbortRef.current;

    return () => {
      for (const id in debounces) {
        const t = debounces[id];
        if (t) clearTimeout(t);
      }
      for (const id in aborts) {
        const c = aborts[id];
        if (c) c.abort();
      }
    };
  }, []);

  return (
    <div className="ContainerModal h-full w-full">
      <div
        className={`h-[calc(h-screen-400px)] w-screen bg-black fixed inset-0 left-0 top-0 opacity-50 z-50 ${isOpen && cart.length > 0 ? "visible" : "hidden"}`}
        onClick={handleClick}
      />
      <div
        className={`h-[100dvh] md:h-screen w-full md:w-[550px] 2xl:w-[576px] right-0 fixed bg-white z-50 p-1 flex flex-col pt-2 transition-all duration-500 ${isOpen && cart.length > 0 ? "translate-x-0" : "translate-x-[100vw]"}`}
      >
        <X
          onClick={handleClick}
          className="text-xl lg:text-2xl text-red-600 absolute right-4 top-2 cursor-pointer hover:text-red-800 z-50"
        />
        <TitleSection
          text={`Meu Carrinho (${cart.length})`}
          icon={<ShoppingCart size={24} className="text-green-500" />}
        />

        <div className="containerProdutos w-full h-[83%] pb-18 mx-auto flex flex-col p-4 overflow-x-hidden overflow-y-auto gap-4 scrollbar">
          {Array.isArray(cart) && cart.map((product) => (
            <div key={product.id} className="w-full">
              <div className="flex flex-col sm:flex-row bg-white py-3 px-1 rounded-xl w-full gap-2 relative bg-whiteReference">
                <div className="w-20 h-20 overflow-hidden rounded-lg min-w-20 ml-4 shadow-lg flex items-center justify-center bg-white">
                  {product.thumb ? (
                    <Image
                      src={product.thumb}
                      width={150}
                      height={150}
                      alt={product.alt || product.productName}
                      className="h-full w-full object-cover hover:rotate-12 transition-all hover:scale-125 duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] bg-gray-100 text-gray-500">
                      sem imagem
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 px-4">
                  <p className="text-sm 2xl:text-lg font-Roboto text-blackReference">{product.productName}</p>

                  {product.hasPersonalization && product.personalization && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] uppercase bg-blue-600 text-white px-2 py-0.5 rounded">
                        Personalização
                      </span>

                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm">
                    <span className="text-gray-500">Cor:</span>
                    <span className="font-medium uppercase">{product.color || "-"}</span>

                    {product.size && (
                      <>
                        <span className="text-gray-500">Tamanho:</span>
                        <span className="font-medium uppercase">{product.size}</span>
                      </>
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
                      {loadingByItem[product.id] && (
                        <span className="text-xs opacity-70 select-none pointer-events-none">
                          Consultando estoque...
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <span>Unidade:</span>
                        <span className="font-medium">
                          {formatPrice(product.unitPriceEffective)}
                        </span>
                      </div>

                      <div className="border-l pl-3">
                        <span className="font-semibold">Total: </span>
                        <span className="font-bold">{calculateSubtotal(product)}</span>
                      </div>
                    </div>

                    {(() => {
                      const availableNum = toNumberBR(stockByItem[product.id]?.quantidadeSaldo);
                      const available =
                        typeof availableNum === "number" && isFinite(availableNum)
                          ? Math.trunc(availableNum)
                          : undefined;
                      if (typeof available !== "number") return null;
                      const aggregatedRequested = getAggregatedRequestedForPool(product);
                      if (aggregatedRequested > available) {
                        return (
                          <span className="text-red-500 text-xs">
                            Quantidade disponível (compartilhado): {available}. No carrinho: {aggregatedRequested}
                          </span>
                        );
                      }
                      return null;
                    })()}

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

        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-fit w-[98%] border-t border-gray-200 p-2 flex flex-col bg-white">
          <p className="font-medium text-sm md:text-base">Total de itens: {cart.length} produtos</p>
          <p className="font-medium text-sm md:text-base">
            Valor Total:
            <span className="font-semibold pl-1 text-sm md:text-base">{formatPrice(totalValue)}</span>
          </p>
          <p className="text-xs">*Frete não incluso</p>
          {hasInvalidQuantities && <p className="text-xs text-red-500">Ajuste as quantidades para prosseguir</p>}

          <div className="flex w-full flex-col-reverse sm:flex-row gap-2 mt-1 justify-center md:justify-end">
            <Button
              onClick={handleClick}
              className="w-full sm:w-fit cursor-pointer text-xs md:text-sm bg-Button-bg hover:bg-Button-bgHover hover:text-Button-textHover hover:border-Button-borderHover border rounded-md text-Button-text px-4 py-2"
            >
              Continuar Comprando
            </Button>

            <Link href={"/entrega"}>
              <Button
                className="disabled:bg-gray-500 w-full sm:w-fit cursor-pointer text-xs md:text-sm bg-green-500 hover:bg-green-400 rounded-md text-Button-text px-4 py-2"
                disabled={hasInvalidQuantities || cart.length === 0}
                onClick={(e) => {
                  if (hasInvalidQuantities || cart.length === 0) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                  handleClick?.(e as React.MouseEvent<HTMLButtonElement | SVGSVGElement | HTMLDivElement, MouseEvent>);
                }}
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
