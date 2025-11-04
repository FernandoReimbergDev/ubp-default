"use client";
import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "../Context/CartContext";
import { ProdutoCart, ProdutoEstoqueItem } from "../types/responseTypes";
import { formatPrice } from "../utils/formatter";
import { Button } from "./Button";
import { TitleSection } from "./TitleSection";

interface ModalProps {
  handleClick?: (event: React.MouseEvent<HTMLButtonElement | SVGSVGElement | HTMLDivElement, MouseEvent>) => void;
  isOpen: boolean;
}

/** Utils */
function toNumberBR(val: string | number | undefined) {
  if (val === undefined || val === null) return undefined;
  const s = String(val).trim();
  if (s === "") return undefined;
  if (s.includes(".") && s.includes(",")) return Number(s.replace(/\./g, "").replace(",", "."));
  if (s.includes(",")) return Number(s.replace(",", "."));
  return Number(s);
}

/* =========================
   Item de produto (memo)
   ========================= */
type RowProps = {
  product: ProdutoCart;
  qty: string;
  onQtyChange: (id: string, next: string) => void;
  onInc: (id: string) => void;
  onDec: (id: string) => void;
  onRemove: (id: string) => void;
  onChangeColor: (id: string, color: string) => void;
  onChangeSize: (id: string, size: string) => void;
  scheduleFetch: (item: ProdutoCart, delay?: number) => void;
  loading: boolean;
  availableShared: number | undefined;   // estoque total do pool cor/tamanho
  poolRequested: number;                 // soma de quantidades do pool
};

const ProductRow = memo(function ProductRow({
  product,
  qty,
  onQtyChange,
  onInc,
  onDec,
  onRemove,
  onChangeColor,
  onChangeSize,
  scheduleFetch,
  loading,
  availableShared,
  poolRequested,
}: RowProps) {
  const subtotal = useMemo(() => {
    const q = parseInt(qty || "0", 10);
    return formatPrice(!isNaN(q) && q > 0 ? q * product.price : 0);
  }, [qty, product.price]);

  const warnShared = typeof availableShared === "number" && poolRequested > availableShared;

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row bg-white py-3 px-1 rounded-xl w-full items-start justify-start gap-2 relative bg-whiteReference">
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

          {product.personalization && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] uppercase bg-blue-600 text-white px-2 py-0.5 rounded">Personalizado</span>
              <span className="text-[11px] text-gray-600 truncate max-w-[200px]" title={product.personalization.fileName}>
                {product.personalization.fileName}
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start md:items-center gap-4">
            <div className="flex items-center gap-2 text-sm md:text-base">
              <p className="text-gray-500">Cor:</p>
              {Array.isArray(product.cores) && (
                <select
                  name="cor"
                  id={`cor-${product.id}`}
                  value={product.color}
                  onChange={(e) => {
                    const newColor = e.target.value;
                    onChangeColor(product.id, newColor);
                    scheduleFetch({ ...product, color: newColor });
                  }}
                  className="border w-44 border-gray-400 uppercase rounded px-1 text-xs"
                >
                  {product.cores.map((cor) => (
                    <option value={cor} key={cor}>
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
                    id={`tamanho-${product.id}`}
                    value={product.size}
                    onChange={(e) => {
                      const newSize = e.target.value;
                      onChangeSize(product.id, newSize);
                      scheduleFetch({ ...product, size: newSize });
                    }}
                    className="border border-gray-400 uppercase rounded px-1 text-xs"
                  >
                    {product.tamanhos.map((tamanho) => (
                      <option value={tamanho} key={tamanho}>
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
                  className="w-6 h-6 flex justify-center items-center text-gray-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                  aria-disabled={loading}
                  onClick={() => onDec(product.id)}
                  aria-label="Diminuir quantidade"
                >
                  <Minus size={16} />
                </button>

                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={qty}
                  className="w-12 md:w-16 px-1 text-center rounded-md disabled:opacity-50"
                  disabled={loading}
                  onChange={(e) => onQtyChange(product.id, e.target.value)}
                />

                <button
                  className="w-6 h-6 flex justify-center items-center text-gray-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                  aria-disabled={loading}
                  onClick={() => onInc(product.id)}
                  aria-label="Aumentar quantidade"
                >
                  <Plus size={16} />
                </button>
              </div>

              {loading && <span className="text-xs opacity-70 select-none pointer-events-none">Consultando estoque...</span>}
            </div>

            <div className="mt-2">
              <p className="text-sm">Subtotal: {subtotal}</p>
            </div>

            {warnShared && (
              <span className="text-red-500 text-xs">
                Quantidade disponível (compartilhado): {availableShared}. No carrinho: {poolRequested}
              </span>
            )}

            {(!qty || parseInt(qty) <= 0) && (
              <span className="text-red-500 text-xs">Digite uma quantidade mínima para prosseguir</span>
            )}

            <button
              type="button"
              className="absolute right-1 md:right-2 bottom-4 cursor-pointer text-red-600 hover:text-red-800"
              onClick={() => onRemove(product.id)}
              aria-label="Remover produto"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </div>
      <hr className="border w-full text-gray-300" />
    </div>
  );
});

/* =========================
   Modal (pai)
   ========================= */
export const CartModal = ({ handleClick, isOpen }: ModalProps) => {
  const { cart, removeProduct, updateQuantity, updateColorOrSize } = useCart();

  // map id -> qty controlada (string)
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  // map id -> estoque (primeiro item do retorno)
  const [stockByItem, setStockByItem] = useState<Record<string, ProdutoEstoqueItem | undefined>>({});
  // map id -> loading
  const [loadingByItem, setLoadingByItem] = useState<Record<string, boolean>>({});

  // Controle por item: debounce, abort e requestId
  const fetchDebounceRef = useRef<Record<string, ReturnType<typeof setTimeout> | null>>({});
  const fetchAbortRef = useRef<Record<string, AbortController | null>>({});
  const requestIdRef = useRef<Record<string, number>>({});
  const fetchTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout> | null>>({});

  // Inicializa quantidades a partir do carrinho
  useEffect(() => {
    const initial = cart.reduce((acc, item) => {
      acc[item.id] = String(item.quantity);
      return acc;
    }, {} as Record<string, string>);
    setQuantities(initial);
  }, [cart]);

  const onQtyChange = useCallback(
    (id: string, value: string) => {
      if (!/^\d*$/.test(value)) return;
      setQuantities((prev) => ({ ...prev, [id]: value }));
      const parsed = parseInt(value, 10);
      updateQuantity(id, isNaN(parsed) ? 0 : parsed);
      const item = cart.find((p) => p.id === id);
      if (item) scheduleFetch(item);
    },
    [cart, updateQuantity]
  );

  const onInc = useCallback(
    (id: string) => {
      setQuantities((prev) => {
        const cur = parseInt(prev[id] || "0", 10);
        const next = String(Math.max(cur + 1, 0));
        updateQuantity(id, parseInt(next, 10));
        const item = cart.find((p) => p.id === id);
        if (item) scheduleFetch(item);
        return { ...prev, [id]: next };
      });
    },
    [cart, updateQuantity]
  );

  const onDec = useCallback(
    (id: string) => {
      setQuantities((prev) => {
        const cur = parseInt(prev[id] || "0", 10);
        const next = String(Math.max(cur - 1, 0));
        updateQuantity(id, parseInt(next, 10));
        const item = cart.find((p) => p.id === id);
        if (item) scheduleFetch(item);
        return { ...prev, [id]: next };
      });
    },
    [cart, updateQuantity]
  );

  const onRemove = useCallback((id: string) => removeProduct(id), [removeProduct]);

  const onChangeColor = useCallback(
    (id: string, color: string) => {
      updateColorOrSize(id, color);
      const item = cart.find((p) => p.id === id);
      if (item) scheduleFetch({ ...item, color });
    },
    [cart, updateColorOrSize]
  );

  const onChangeSize = useCallback(
    (id: string, size: string) => {
      updateColorOrSize(id, undefined, size);
      const item = cart.find((p) => p.id === id);
      if (item) scheduleFetch({ ...item, size });
    },
    [cart, updateColorOrSize]
  );

  // Soma agregada por pool (chavePro+cor+tamanho)
  const getAggregatedRequestedForPool = useCallback(
    (base: ProdutoCart) =>
      cart.reduce((sum, it) => {
        const samePool =
          it.chavePro === base.chavePro &&
          (it.color || "") === (base.color || "") &&
          (it.size || "") === (base.size || "");
        if (!samePool) return sum;
        const q = parseInt(quantities[it.id] || "0", 10);
        return sum + (isNaN(q) ? 0 : q);
      }, 0),
    [cart, quantities]
  );

  // Busca de estoque por item
  const fetchItemStock = useCallback(
    async (item: ProdutoCart, signal?: AbortSignal, reqId?: number) => {
      if (!item.chavePro) {
        setStockByItem((prev) => ({ ...prev, [item.id]: undefined }));
        return;
      }
      setLoadingByItem((prev) => ({ ...prev, [item.id]: true }));

      try {
        const payload: Record<string, unknown> = {
          codPro: item.codPro,
          chavePro: item.chavePro,
        };
        if (item.color && item.color.trim() !== "") payload.descrProCor = item.color;
        if (item.size && item.size.trim() !== "") payload.descrProTamanho = item.size;

        const doRequest = async () =>
          fetch("/api/stock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal,
          });

        let res = await doRequest();
        if (!res.ok && (res.status === 429 || res.status >= 500)) {
          res = await doRequest();
        }

        const result: {
          success: boolean;
          data?: { success: boolean; message: string; result: { produtos: ProdutoEstoqueItem[] } | ProdutoEstoqueItem[] };
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
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") {
          if (reqId === requestIdRef.current[item.id]) {
            setLoadingByItem((prev) => ({ ...prev, [item.id]: false }));
          }
          return;
        }
        console.error("error ao requisitar produtos para api externa", error);
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

  // Debounce+abort por item
  const scheduleFetch = useCallback(
    (item: ProdutoCart, delayMs = 600) => {
      const id = item.id;
      const requested = parseInt(quantities[id] || "0", 10);
      if (!(requested > 0)) return;

      if (fetchDebounceRef.current[id]) clearTimeout(fetchDebounceRef.current[id]!);
      fetchDebounceRef.current[id] = setTimeout(() => {
        if (fetchAbortRef.current[id]) fetchAbortRef.current[id]!.abort();

        const nextId = (requestIdRef.current[id] ?? 0) + 1;
        requestIdRef.current[id] = nextId;

        setLoadingByItem((prev) => ({ ...prev, [id]: true }));

        const controller = new AbortController();
        fetchAbortRef.current[id] = controller;

        if (fetchTimeoutRef.current[id]) clearTimeout(fetchTimeoutRef.current[id]!);
        fetchTimeoutRef.current[id] = setTimeout(() => {
          try {
            controller.abort();
          } catch { }
        }, 8000);

        fetchItemStock(item, controller.signal, nextId);
      }, delayMs);
    },
    [fetchItemStock, quantities]
  );

  // Carrega estoque inicial
  useEffect(() => {
    cart.forEach((item) => scheduleFetch(item, 0));
  }, [cart, scheduleFetch]);

  // Cleanup geral (snapshot)
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

  // Total e flags derivadas (useMemo)
  const totalValue = useMemo(
    () =>
      cart.reduce((total, product) => {
        const q = parseInt(quantities[product.id] || "0", 10);
        return total + (isNaN(q) ? 0 : q * product.price);
      }, 0),
    [cart, quantities]
  );

  const hasInvalidQuantities = useMemo(
    () =>
      cart.some((item) => {
        const availableNum = toNumberBR(stockByItem[item.id]?.quantidadeSaldo);
        const available = typeof availableNum === "number" && isFinite(availableNum) ? Math.trunc(availableNum) : undefined;
        if (typeof available !== "number") return false;
        const aggregatedRequested = getAggregatedRequestedForPool(item);
        return aggregatedRequested > available;
      }),
    [cart, stockByItem, getAggregatedRequestedForPool]
  );

  // estoque compartilhado e requested por item (para passar ao row)
  const getPoolAvailable = useCallback(
    (item: ProdutoCart) => {
      const availableNum = toNumberBR(stockByItem[item.id]?.quantidadeSaldo);
      return typeof availableNum === "number" && isFinite(availableNum) ? Math.trunc(availableNum) : undefined;
    },
    [stockByItem]
  );

  const getPoolRequested = useCallback((item: ProdutoCart) => getAggregatedRequestedForPool(item), [getAggregatedRequestedForPool]);

  return (
    <div className="ContainerModal h-full w-full">
      <div
        className={`h-[calc(h-screen-400px)] w-screen bg-black fixed inset-0 left-0 top-0 opacity-50 z-50 ${isOpen && cart.length > 0 ? "visible" : "hidden"}`}
        onClick={handleClick}
      />
      <div
        className={`h-[100dvh] md:h-screen w-full md:w-[550px] 2xl:w-[576px] right-0 fixed bg-white z-50 p-1 flex flex-col items-start justify-start pt-2 transition-all duration-500 ${isOpen && cart.length > 0 ? "translate-x-0" : "translate-x-[100vw]"
          }`}
      >
        <button
          type="button"
          onClick={handleClick}
          className="text-xl lg:text-2xl text-red-600 absolute right-4 top-2 cursor-pointer hover:text-red-800 z-50"
          aria-label="Fechar carrinho"
        >
          <X />
        </button>

        <TitleSection text={`Meu Carrinho (${cart.length})`} icon={<ShoppingCart size={24} className="text-green-500" />} />

        <div className="containerProdutos w-full h-[83%] pb-18 mx-auto flex flex-col items-start justify-start p-4 overflow-x-hidden overflow-y-auto gap-4 scrollbar">
          {Array.isArray(cart) &&
            cart.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                qty={quantities[product.id] ?? ""}
                onQtyChange={onQtyChange}
                onInc={onInc}
                onDec={onDec}
                onRemove={onRemove}
                onChangeColor={onChangeColor}
                onChangeSize={onChangeSize}
                scheduleFetch={scheduleFetch}
                loading={!!loadingByItem[product.id]}
                availableShared={getPoolAvailable(product)}
                poolRequested={getPoolRequested(product)}
              />
            ))}
        </div>

        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-fit w-[98%] border-t-1 border-gray-500 p-2 flex flex-col items-start justify-start bg-white">
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
