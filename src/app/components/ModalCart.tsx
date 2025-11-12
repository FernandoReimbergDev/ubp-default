"use client";
import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "../Context/CartContext";
import type { CartItemPersist, PersonalizacaoPreco } from "../types/cart";
import type { PrecoProduto, ProdutoEstoqueItem } from "../types/responseTypes";
import { formatPrice } from "../utils/formatter";
import { Button } from "./Button";
import { TitleSection } from "./TitleSection";

interface ModalProps {
  handleClick?: (event: React.MouseEvent<HTMLButtonElement | SVGSVGElement | HTMLDivElement, MouseEvent>) => void;
  isOpen: boolean;
}

// tempos configuráveis
const DEBOUNCE_MS = 900; // pausa de digitação antes de consultar
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

  // Função auxiliar para converter string/number para float
  const toFloat = (val: string | number | undefined | null): number | undefined => {
    if (val === undefined || val === null) return undefined;
    const s = String(val).trim();
    const normalized =
      s.includes(",") && s.includes(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(",", ".");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : undefined;
  };

  // Função para encontrar o preço do produto baseado na quantidade
  const findPriceForQuantity = useCallback(
    (precos: PrecoProduto[] | undefined, vluGridPro: string | undefined, quantity: number) => {
      if (!precos || precos.length === 0) {
        return {
          qtdiProPrc: "1",
          qtdfProPrc: "0",
          vluProPrc: vluGridPro || "0",
        };
      }

      if (!quantity || quantity === 0) {
        return {
          ...precos[0],
          vluProPrc: vluGridPro || precos[0].vluProPrc,
        };
      }

      const foundPrice = precos.find((price) => {
        const qtdi = parseInt(price.qtdiProPrc) || 0;
        const qtdf = parseInt(price.qtdfProPrc) || 0;

        if (qtdf === 0 || qtdf >= 999999999) {
          return quantity >= qtdi;
        }

        return quantity >= qtdi && quantity <= qtdf;
      });

      return (
        foundPrice || {
          ...precos[0],
          vluProPrc: vluGridPro || precos[0].vluProPrc,
        }
      );
    },
    []
  );

  // Função para obter preço da personalização baseado na quantidade
  const getPersonalizationUnitPrice = useCallback(
    (personalization: PersonalizacaoPreco[] | undefined, quantity: number): number => {
      if (!personalization?.length || !quantity || quantity <= 0) {
        if (personalization?.length) {
          return toFloat(personalization[0].vluPersonalPrc) ?? 0;
        }
        return 0;
      }

      const faixaEncontrada = personalization.find((faixa) => {
        const qtdi = parseInt(faixa.qtdiPersonalPrc) || 0;
        const qtdf = parseInt(faixa.qtdfPersonalPrc) || 0;

        if (qtdf === 0 || qtdf >= 999999999) {
          return quantity >= qtdi;
        }

        return quantity >= qtdi && quantity <= qtdf;
      });

      if (faixaEncontrada) {
        return toFloat(faixaEncontrada.vluPersonalPrc) ?? 0;
      }

      return toFloat(personalization[0].vluPersonalPrc) ?? 0;
    },
    []
  );

  // Função para recalcular o preço unitário efetivo baseado na quantidade atual
  const recalculateEffectivePrice = useCallback(
    (item: CartItemPersist, quantity: number): number => {
      let price = 0;

      // Busca o preço do produto baseado na quantidade atual
      if (quantity > 0) {
        const currentPrice = findPriceForQuantity(item.precos, item.vluGridPro, quantity);
        if (currentPrice) {
          price = parseFloat(currentPrice.vluProPrc) || 0;
        } else {
          price = item.unitPriceBase;
        }
      } else {
        price = item.unitPriceBase;
      }

      // Adiciona o valor da personalização se houver
      if (item.hasPersonalization && item.personalization && quantity > 0) {
        const personalizationPrice = getPersonalizationUnitPrice(item.personalization.precos, quantity);
        price += personalizationPrice;
      }

      // Adiciona o valor adicional da amostra se estiver marcado
      if (item.isAmostra && item.valorAdicionalAmostraPro) {
        price += parseFloat(item.valorAdicionalAmostraPro || "0");
      }

      return price;
    },
    [findPriceForQuantity, getPersonalizationUnitPrice]
  );

  // Função para validar quantidade mínima (qtdi) das faixas de preço
  const validateMinimumQuantity = useCallback(
    (item: CartItemPersist, quantity: number | undefined): { valid: boolean; minQty: number; message?: string } => {
      if (item.isAmostra) {
        // Amostra sempre permite quantidade 1
        return { valid: true, minQty: 1 };
      }

      // Se quantidade for undefined, 0 ou inválida, retorna inválido
      if (quantity === undefined || quantity === null || isNaN(quantity) || quantity <= 0) {
        return { valid: false, minQty: 1, message: "Digite uma quantidade válida para prosseguir" };
      }

      // Verifica quantidade mínima do produto (qtdMinPro)
      if (item.qtdMinPro) {
        const qtdMin = parseInt(item.qtdMinPro) || 0;
        if (qtdMin > 0 && quantity < qtdMin) {
          return {
            valid: false,
            minQty: qtdMin,
            message: `Esse produto é vendido na quantidade mínima de ${qtdMin}`,
          };
        }
      }

      // Verifica se a quantidade está dentro de alguma faixa de preço válida
      if (item.precos && item.precos.length > 0) {
        // Encontra a menor quantidade inicial (qtdi) entre todas as faixas
        const qtdiValues = item.precos.map((price) => parseInt(price.qtdiProPrc) || 0).filter((qtdi) => qtdi > 0);
        const minQtdi = qtdiValues.length > 0 ? Math.min(...qtdiValues) : 0;

        // Verifica se a quantidade está dentro de alguma faixa válida
        const isValidQuantity = item.precos.some((price) => {
          const qtdi = parseInt(price.qtdiProPrc) || 0;
          const qtdf = parseInt(price.qtdfProPrc) || 0;

          // Se qtdf é 0 ou muito grande, significa que é a última faixa (sem limite superior)
          if (qtdf === 0 || qtdf >= 999999999) {
            return quantity >= qtdi;
          }

          // Verifica se a quantidade está dentro da faixa
          return quantity >= qtdi && quantity <= qtdf;
        });

        // Se não está em nenhuma faixa válida e existe uma quantidade mínima definida
        if (!isValidQuantity && minQtdi > 0) {
          return {
            valid: false,
            minQty: minQtdi,
            message: `Quantidade mínima para este produto é ${minQtdi} unidades`,
          };
        }
      }

      return { valid: true, minQty: 1 };
    },
    []
  );

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

  // Calcula o preço unitário efetivo recalculado para cada item baseado na quantidade digitada
  // Isso é necessário para mostrar o preço em tempo real enquanto o usuário digita
  // Quando a quantidade for confirmada, o carrinho será atualizado com o preço correto
  const effectivePrices = useMemo(() => {
    const prices: Record<string, number> = {};
    cart.forEach((item) => {
      const quantityInCart = item.quantity;
      const quantityStr = quantities[item.id] ?? "";
      // Se estiver vazio, usa o preço do carrinho
      if (quantityStr === "") {
        prices[item.id] = item.unitPriceEffective;
        return;
      }
      const quantityInInput = parseInt(quantityStr, 10);

      // Se a quantidade digitada é diferente da quantidade no carrinho,
      // recalcula para mostrar em tempo real
      // Caso contrário, usa o preço já calculado no carrinho
      if (!isNaN(quantityInInput) && quantityInInput !== quantityInCart && quantityInInput > 0) {
        prices[item.id] = recalculateEffectivePrice(item, quantityInInput);
      } else {
        // Usa o preço já calculado e persistido no carrinho
        prices[item.id] = item.unitPriceEffective;
      }
    });
    return prices;
  }, [cart, quantities, recalculateEffectivePrice]);

  // Valida quantidades mínimas para todos os itens
  const quantityValidations = useMemo(() => {
    const validations: Record<string, { valid: boolean; minQty: number; message?: string }> = {};
    cart.forEach((item) => {
      // Permite valores vazios (undefined) ou zero para validação
      const quantityStr = quantities[item.id];
      const quantity = quantityStr === "" || quantityStr === undefined ? undefined : parseInt(quantityStr, 10);
      validations[item.id] = validateMinimumQuantity(item, isNaN(quantity!) ? undefined : quantity);
    });
    return validations;
  }, [cart, quantities, validateMinimumQuantity]);

  // Verifica se há quantidades inválidas (menor que qtdi)
  const hasInvalidMinimumQuantities = useMemo(() => {
    return Object.values(quantityValidations).some((validation) => !validation.valid);
  }, [quantityValidations]);

  const calculateSubtotal = (product: CartItemPersist) => {
    const quantityStr = quantities[product.id] ?? "";
    // Se estiver vazio ou zero, retorna 0
    if (quantityStr === "" || quantityStr === "0") return formatPrice(0);
    const quantity = parseInt(quantityStr, 10);
    if (isNaN(quantity) || quantity <= 0) return formatPrice(0);

    // Se a quantidade digitada é diferente da quantidade no carrinho,
    // usa o preço recalculado em tempo real
    // Caso contrário, usa o subtotal já calculado no carrinho
    if (quantity !== product.quantity) {
      const effectivePrice = effectivePrices[product.id] || product.unitPriceEffective;
      return formatPrice(quantity * effectivePrice);
    }
    // Usa o subtotal já calculado e persistido no carrinho
    return formatPrice(product.subtotal || 0);
  };

  const handleInputChange = (id: string, value: string) => {
    // Permite qualquer valor numérico, incluindo string vazia e zero
    if (value === "" || /^\d+$/.test(value)) {
      setQuantities((prev) => ({ ...prev, [id]: value }));

      // Só atualiza o carrinho se o valor for válido e maior que zero
      // Isso permite que o usuário digite zero ou apague o valor sem forçar atualização
      const parsed = value === "" ? 0 : parseInt(value, 10);
      if (!isNaN(parsed) && parsed > 0) {
        updateQuantity(id, parsed);
        const item = cart.find((p) => p.id === id);
        if (item) scheduleFetch(item); // só dispara após a pausa
      } else if (value === "" || parsed === 0) {
        // Se for zero ou vazio, não atualiza o carrinho mas mantém no estado local
        // O carrinho mantém o valor anterior até que seja digitado um valor válido
      }
    }
  };

  const changeQuantity = (id: string, current: string, delta: number) => {
    // Se current estiver vazio, usa o valor do produto como fallback
    const currentValue = current === "" ? undefined : current;
    const parsed = currentValue === undefined ? undefined : parseInt(currentValue, 10);
    // Se não conseguiu parsear, usa o valor do produto do carrinho
    const baseValue = isNaN(parsed!) || parsed === undefined ? cart.find((p) => p.id === id)?.quantity ?? 1 : parsed;
    const newQty = Math.max(baseValue + delta, 0); // Permite ir até 0
    setQuantities((prev) => ({ ...prev, [id]: String(newQty) }));
    // Só atualiza o carrinho se for maior que 0
    if (newQty > 0) {
      updateQuantity(id, newQty);
      const item = cart.find((p) => p.id === id);
      if (item) scheduleFetch(item);
    }
  };

  const totalValue = useMemo(() => {
    return cart.reduce((total, product) => {
      const quantityStr = quantities[product.id] ?? "";
      // Se estiver vazio ou zero, não adiciona ao total
      if (quantityStr === "" || quantityStr === "0") {
        return total;
      }
      const quantityInInput = parseInt(quantityStr, 10);

      // Se a quantidade digitada é diferente da quantidade no carrinho,
      // recalcula para mostrar em tempo real
      if (!isNaN(quantityInInput) && quantityInInput !== product.quantity && quantityInInput > 0) {
        const effectivePrice = effectivePrices[product.id] || product.unitPriceEffective;
        return total + quantityInInput * effectivePrice;
      }
      // Usa o subtotal já calculado e persistido no carrinho
      return total + (product.subtotal || 0);
    }, 0);
  }, [cart, quantities, effectivePrices]);

  const hasInvalidQuantities = useMemo(() => {
    return cart.some((item) => {
      const availableNum = toNumberBR(stockByItem[item.id]?.quantidadeSaldo);
      const available =
        typeof availableNum === "number" && isFinite(availableNum) ? Math.trunc(availableNum) : undefined;
      if (typeof available !== "number") return false;
      const aggregatedRequested = getAggregatedRequestedForPool(item);
      return aggregatedRequested > available;
    });
  }, [cart, stockByItem, getAggregatedRequestedForPool]);

  const fetchItemStock = useCallback(async (item: CartItemPersist, signal?: AbortSignal, reqId?: number) => {
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
        : (raw as { produtos?: ProdutoEstoqueItem[] })?.produtos ?? [];
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
  }, []);

  // Agenda consulta com debounce e cancelamento por item
  const scheduleFetch = useCallback(
    (item: CartItemPersist, delayMs = DEBOUNCE_MS) => {
      const id = item.id;
      const requested = parseInt(quantities[id] || "0", 10);

      if (!(requested > 0)) return;

      if (fetchDebounceRef.current[id]) clearTimeout(fetchDebounceRef.current[id]!);

      fetchDebounceRef.current[id] = setTimeout(() => {
        if (fetchAbortRef.current[id]) {
          try {
            fetchAbortRef.current[id]!.abort();
          } catch {}
        }

        const current = requestIdRef.current[id] ?? 0;
        const nextId = current + 1;
        requestIdRef.current[id] = nextId;

        const controller = new AbortController();
        fetchAbortRef.current[id] = controller;

        if (fetchTimeoutRef.current[id]) clearTimeout(fetchTimeoutRef.current[id]!);
        fetchTimeoutRef.current[id] = setTimeout(() => {
          try {
            controller.abort();
          } catch {}
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
        className={`h-[calc(h-screen-400px)] w-screen bg-black fixed inset-0 left-0 top-0 opacity-50 z-50 ${
          isOpen && cart.length > 0 ? "visible" : "hidden"
        }`}
        onClick={handleClick}
      />
      <div
        className={`h-dvh md:h-screen w-full md:w-[550px] 2xl:w-[576px] right-0 fixed bg-white z-50 p-1 flex flex-col pt-2 transition-all duration-500 ${
          isOpen && cart.length > 0 ? "translate-x-0" : "translate-x-[100vw]"
        }`}
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
          {Array.isArray(cart) &&
            cart.map((product) => (
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

                    <div className="flex items-start justify-start flex-col gap-2">
                      <div className="flex flex-col items-start gap-2 mt-2">
                        <div className="flex items-center gap-2">
                          <button
                            className={`w-6 h-6 flex justify-center items-center ${
                              product.isAmostra ? "text-gray-300 cursor-not-allowed" : "text-gray-600 cursor-pointer"
                            }`}
                            onClick={() =>
                              !product.isAmostra &&
                              changeQuantity(product.id, quantities[product.id] ?? String(product.quantity), -1)
                            }
                            disabled={product.isAmostra}
                          >
                            <Minus size={16} />
                          </button>

                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={quantities[product.id] ?? ""}
                            readOnly={product.isAmostra}
                            className={`w-12 md:w-16 px-1 text-center rounded-md ${
                              product.isAmostra ? "bg-gray-100 cursor-not-allowed" : ""
                            }`}
                            onChange={(e) => {
                              if (!product.isAmostra) {
                                const value = e.target.value;
                                // Permite string vazia ou apenas dígitos (incluindo zero)
                                if (value === "" || /^\d+$/.test(value)) {
                                  handleInputChange(product.id, value);
                                }
                              }
                            }}
                          />

                          <button
                            className={`w-6 h-6 flex justify-center items-center ${
                              product.isAmostra ? "text-gray-300 cursor-not-allowed" : "text-gray-600 cursor-pointer"
                            }`}
                            onClick={() =>
                              !product.isAmostra &&
                              changeQuantity(product.id, quantities[product.id] ?? String(product.quantity), 1)
                            }
                            disabled={product.isAmostra}
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
                            {(() => {
                              const quantityStr = quantities[product.id] ?? "";
                              // Se estiver vazio ou zero, mostra o preço do carrinho
                              if (quantityStr === "" || quantityStr === "0") {
                                return formatPrice(product.unitPriceEffective);
                              }
                              const quantityInInput = parseInt(quantityStr, 10);
                              // Se está digitando uma quantidade diferente, mostra o preço recalculado
                              // Caso contrário, mostra o preço já calculado no carrinho
                              if (
                                !isNaN(quantityInInput) &&
                                quantityInInput !== product.quantity &&
                                quantityInInput > 0
                              ) {
                                return formatPrice(effectivePrices[product.id] || product.unitPriceEffective);
                              }
                              return formatPrice(product.unitPriceEffective);
                            })()}
                          </span>
                          {product.isAmostra && (
                            <span className="ml-1 bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                              Amostra
                            </span>
                          )}
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

                      {/* Validação de quantidade mínima (qtdi) e quantidade válida */}
                      {(() => {
                        const validation = quantityValidations[product.id];
                        const quantityStr = quantities[product.id] ?? "";
                        const quantity = quantityStr === "" ? undefined : parseInt(quantityStr, 10);

                        // Se não há quantidade ou é 0 ou vazio, mostra mensagem genérica
                        if (quantityStr === "" || quantity === undefined || quantity === 0 || isNaN(quantity!)) {
                          return (
                            <span className="text-red-500 text-xs">Digite uma quantidade válida para prosseguir</span>
                          );
                        }

                        // Se há validação e não é válida, mostra a mensagem de erro específica
                        if (validation && !validation.valid) {
                          return <span className="text-red-500 text-xs">{validation.message}</span>;
                        }

                        return null;
                      })()}

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
          {hasInvalidMinimumQuantities && (
            <p className="text-xs text-red-500">Ajuste as quantidades mínimas (qtdi) para prosseguir</p>
          )}

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
                disabled={hasInvalidQuantities || hasInvalidMinimumQuantities || cart.length === 0}
                onClick={(e) => {
                  if (hasInvalidQuantities || hasInvalidMinimumQuantities || cart.length === 0) {
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
