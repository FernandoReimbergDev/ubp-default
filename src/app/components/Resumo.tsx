"use client";

import { useCart } from "@/app/Context/CartContext";
import { formatPrice } from "@/app/utils/formatter";
import { FileSearch2, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useMemo, useEffect, useRef, useState, useCallback } from "react";
import { getPackageVolumeAndWeight } from "@/app/services/mountVolume";
import Cookies from "js-cookie";
import type { CartItemPersist, PersonalizacaoPreco } from "@/app/types/cart";
import type { PrecoProduto } from "@/app/types/responseTypes";

interface ResumoProps {
  delivery: { stateCode: string; city: string; zipCode: string };
}

export function Resumo({ delivery }: ResumoProps) {
  const { cart, fetchProductFrete, cartReady } = useCart();
  const [valorFrete, setValorFrete] = useState<number | string | undefined>(undefined);
  const [mounted, setMounted] = useState(false);
  const [loadingFrete, setLoadingFrete] = useState(false);
  const [freteErro, setFreteErro] = useState(false);

  // Handle client-side initialization - só executa no cliente após montagem
  useEffect(() => {
    setMounted(true);
    try {
      const savedFrete = Cookies.get("valorFrete");
      if (savedFrete) {
        setValorFrete(Number(savedFrete));
      }
      setLoadingFrete(false);
    } catch (error) {
      console.error("Error reading frete from cookies:", error);
      setLoadingFrete(false);
    }
  }, []);

  // Salva o valor do frete no cookie sempre que ele mudar
  useEffect(() => {
    if (valorFrete !== undefined) {
      try {
        Cookies.set("valorFrete", String(valorFrete), { expires: 1 }); // Expira em 1 dia
      } catch (error) {
        console.error("Erro ao salvar valor do frete no cookie:", error);
      }
    }
  }, [valorFrete]);

  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const lastKeyRef = useRef<string>("");

  // Função auxiliar para converter string/number para float
  const toFloat = useCallback((val: string | number | undefined | null): number | undefined => {
    if (val === undefined || val === null) return undefined;
    const s = String(val).trim();
    const normalized =
      s.includes(",") && s.includes(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(",", ".");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : undefined;
  }, []);

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
    [toFloat]
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

  // 1) Quantidades e total
  const quantities = useMemo(() => {
    return cart.reduce((acc, item) => {
      acc[item.id] = String(item.quantity);
      return acc;
    }, {} as Record<string, string>);
  }, [cart]);

  // Calcula o preço unitário efetivo recalculado para cada item baseado na quantidade atual
  const effectivePrices = useMemo(() => {
    const prices: Record<string, number> = {};
    cart.forEach((item) => {
      const quantity = parseInt(quantities[item.id] || "0", 10);
      if (!isNaN(quantity) && quantity > 0) {
        prices[item.id] = recalculateEffectivePrice(item, quantity);
      } else {
        prices[item.id] = item.unitPriceEffective;
      }
    });
    return prices;
  }, [cart, quantities, recalculateEffectivePrice]);

  // Calcula o total usando os preços recalculados
  const totalValue = useMemo(() => {
    return cart.reduce((total, product) => {
      const q = parseInt(quantities[product.id] || "0", 10);
      if (isNaN(q) || q <= 0) return total;
      // Usa o preço recalculado baseado na quantidade atual
      const effectivePrice = effectivePrices[product.id] || product.unitPriceEffective;
      return total + q * effectivePrice;
    }, 0);
  }, [cart, quantities, effectivePrices]);

  // 2) Pacote (aceita dimensões/peso como string)
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

  // 3) Delivery pronto
  const deliveryReady = useMemo(() => {
    const zip = (delivery?.zipCode || "").replace(/\D/g, "");
    const uf = (delivery?.stateCode || "").trim();
    const city = (delivery?.city || "").trim();
    return { ready: Boolean(zip.length === 8 && uf && city), zip, uf, city };
  }, [delivery]);

  // 5) Normaliza parâmetros com validação robusta
  const norm = useMemo(() => {
    // Função auxiliar para validar e normalizar valores numéricos
    const safeNumber = (value: number | undefined | null, min: number = 0, defaultValue: number = 0): number => {
      if (value === undefined || value === null) {
        return defaultValue;
      }
      const num = typeof value === "number" ? value : Number(value);
      if (isNaN(num) || !Number.isFinite(num) || num < min) {
        return defaultValue;
      }
      return num;
    };

    // Peso em gramas, converte para kg (divide por 1000)
    const pesoTotalGrams = safeNumber(pkg?.pesoTotal, 0, 0);
    const pesoKg = pesoTotalGrams > 0 ? pesoTotalGrams / 1000 : 0;

    // Dimensões em cm (valores mínimos de segurança)
    const altura = safeNumber(pkg?.altura, 1, 1);
    const largura = safeNumber(pkg?.largura, 1, 1);
    const comprimento = safeNumber(pkg?.comprimento, 1, 1);

    // Valor total da compra
    const purchaseAmountNum = typeof totalValue === "number" && Number.isFinite(totalValue) ? totalValue : 0;

    return {
      purchaseAmount: purchaseAmountNum.toFixed(2),
      uf: deliveryReady.uf || "",
      city: deliveryReady.city || "",
      zip: deliveryReady.zip || "",
      weightKg: pesoKg.toFixed(2),
      altura: String(Math.max(1, Math.ceil(altura))), // Mínimo 1cm, arredonda para cima
      largura: String(Math.max(1, Math.ceil(largura))), // Mínimo 1cm, arredonda para cima
      comprimento: String(Math.max(1, Math.ceil(comprimento))), // Mínimo 1cm, arredonda para cima
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

  // 6) Chave única do frete
  const freteKey = useMemo(() => {
    const ids = cart
      .map((p) => `${p.id}:${quantities[p.id]}`)
      .sort()
      .join("|");
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

  // 7) Consulta com retry e cache da chave - função robusta com tratamento de erros
  const runFrete = useCallback(
    async (key: string) => {
      // Validações iniciais
      if (!cartReady) {
        console.debug("Carrinho não está pronto");
        return;
      }
      if (!deliveryReady.ready) {
        console.debug("Dados de entrega não estão prontos");
        return;
      }
      if (!cart || !Array.isArray(cart) || cart.length === 0) {
        console.debug("Carrinho vazio");
        return;
      }
      if (!fetchProductFrete) {
        console.warn("Função fetchProductFrete não disponível");
        return;
      }
      if (lastKeyRef.current === key) {
        console.debug("Chave de frete não mudou, ignorando");
        return;
      }

      // Cancela requisição anterior se existir
      try {
        abortRef.current?.abort();
      } catch {
        // Ignora erros ao abortar
      }

      const controller = new AbortController();
      abortRef.current = controller;
      const reqId = ++requestIdRef.current;

      try {
        setLoadingFrete(true);
        setFreteErro(false);

        // Valida valores antes de fazer a consulta
        const purchaseAmountNum = Number(norm.purchaseAmount);
        const weightKgNum = Number(norm.weightKg);
        const alturaNum = Number(norm.altura);
        const larguraNum = Number(norm.largura);
        const comprimentoNum = Number(norm.comprimento);

        // Se o valor da compra for maior que 1500, frete é grátis
        if (!isNaN(purchaseAmountNum) && purchaseAmountNum > 1500) {
          if (reqId === requestIdRef.current) {
            setValorFrete(0);
            setLoadingFrete(false);
            setFreteErro(false);
            lastKeyRef.current = key;
          }
          return;
        }

        // Valida se os valores necessários são válidos
        if (
          isNaN(weightKgNum) ||
          weightKgNum <= 0 ||
          isNaN(alturaNum) ||
          alturaNum <= 0 ||
          isNaN(larguraNum) ||
          larguraNum <= 0 ||
          isNaN(comprimentoNum) ||
          comprimentoNum <= 0
        ) {
          console.warn("Valores inválidos para cálculo de frete:", {
            weightKg: norm.weightKg,
            altura: norm.altura,
            largura: norm.largura,
            comprimento: norm.comprimento,
          });
          if (reqId === requestIdRef.current) {
            setFreteErro(true);
            setLoadingFrete(false);
          }
          return;
        }

        // Função auxiliar para fazer a chamada com validação
        const callFrete = async (): Promise<number | undefined> => {
          try {
            const result = await fetchProductFrete(
              norm.purchaseAmount,
              norm.uf,
              norm.city,
              norm.zip,
              norm.weightKg,
              norm.altura,
              norm.largura,
              norm.comprimento
            );

            // Valida o resultado
            if (result === undefined || result === null) {
              return undefined;
            }

            const resultNum = typeof result === "number" ? result : Number(result);

            if (isNaN(resultNum) || !Number.isFinite(resultNum)) {
              console.warn("Valor de frete inválido retornado:", result);
              return undefined;
            }

            // Garante que o valor seja >= 0
            return Math.max(0, resultNum);
          } catch (error) {
            // Erro já foi tratado na função fetchProductFrete
            console.debug("Erro na chamada de frete (já tratado):", error);
            return undefined;
          }
        };

        // Tenta fazer a consulta com retry
        let amount: number | undefined;

        try {
          amount = await callFrete();
        } catch (firstError) {
          // Se for AbortError, apenas retorna
          if (firstError instanceof Error && firstError.name === "AbortError") {
            return;
          }

          // Aguarda um pouco e tenta novamente
          try {
            await new Promise((resolve) => setTimeout(resolve, 600));
            if (reqId === requestIdRef.current && !controller.signal.aborted) {
              amount = await callFrete();
            }
          } catch (retryError) {
            // Se for AbortError no retry, apenas retorna
            if (retryError instanceof Error && retryError.name === "AbortError") {
              return;
            }
            console.debug("Erro no retry de frete:", retryError);
          }
        }

        // Atualiza o estado apenas se ainda for a requisição atual
        if (reqId === requestIdRef.current) {
          // Se foi abortado, não atualiza o estado
          if (controller.signal.aborted) {
            return;
          }

          // Se o valor total da compra for maior que 1500, frete é grátis
          const totalValueNum = Number(totalValue);
          if (!isNaN(totalValueNum) && totalValueNum > 1500) {
            setValorFrete(0);
            setFreteErro(false);
          } else if (amount !== undefined && amount !== null) {
            // Valor válido retornado - valida antes de setar
            const validAmount = typeof amount === "number" && Number.isFinite(amount) ? Math.max(0, amount) : 0;
            setValorFrete(validAmount);
            setFreteErro(false);
          } else {
            // Não conseguiu obter o valor do frete
            setFreteErro(true);
            // Mantém o valor anterior se existir, senão deixa undefined
            // Não remove do cookie para manter o último valor válido
          }

          setLoadingFrete(false);
          lastKeyRef.current = key;
        }
      } catch (e: unknown) {
        // Tratamento de erro geral
        if (reqId === requestIdRef.current) {
          // Se for AbortError, apenas retorna sem atualizar estado
          if (e instanceof Error && e.name === "AbortError") {
            return;
          }

          // Outros erros
          console.error("Erro inesperado ao calcular frete:", e);
          setFreteErro(true);
          setLoadingFrete(false);

          // Não remove o cookie para manter o último valor válido
          // O usuário ainda pode ver o último valor calculado
        }
      }
    },
    [cartReady, deliveryReady.ready, cart, fetchProductFrete, norm, totalValue]
  );

  // 8) Executa a consulta de frete quando necessário (apenas no cliente após montagem)
  useEffect(() => {
    if (!mounted) return;
    runFrete(freteKey);
  }, [mounted, freteKey, runFrete]);

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
        <span>
          {(() => {
            if (!mounted || loadingFrete) {
              return formatPrice(0);
            }

            // Função segura para converter valor do frete
            const getFreteValue = (): number => {
              if (valorFrete === undefined || valorFrete === null) {
                return 0;
              }

              const numValue = typeof valorFrete === "number" ? valorFrete : Number(valorFrete);

              if (isNaN(numValue) || !Number.isFinite(numValue)) {
                return 0;
              }

              return Math.max(0, numValue);
            };

            return formatPrice(getFreteValue());
          })()}
        </span>
      </div>

      {mounted && valorFrete === 0 && !loadingFrete && !freteErro && (
        <p className="text-[11px] text-green-700">* Frete gratuito para compras acima de R$ 1.500,00</p>
      )}

      {mounted && freteErro && !loadingFrete && (
        <p className="text-[11px] text-orange-600">
          * Não foi possível calcular o frete. Entre em contato para mais informações.
        </p>
      )}

      <hr className="text-gray-300" />

      <div>
        <div className="bg-green-300 flex justify-between items-center px-2 py-4">
          <p className="text-sm">Valor Total:</p>
          <span>
            {(() => {
              // Função segura para calcular o total
              const calculateTotal = (): number => {
                const totalValueNum = typeof totalValue === "number" ? totalValue : Number(totalValue);
                const safeTotalValue = isNaN(totalValueNum) || !Number.isFinite(totalValueNum) ? 0 : totalValueNum;

                if (!mounted || loadingFrete) {
                  return safeTotalValue;
                }

                // Função segura para obter valor do frete
                const getFreteValue = (): number => {
                  if (valorFrete === undefined || valorFrete === null) {
                    return 0;
                  }

                  const numValue = typeof valorFrete === "number" ? valorFrete : Number(valorFrete);

                  if (isNaN(numValue) || !Number.isFinite(numValue)) {
                    return 0;
                  }

                  return Math.max(0, numValue);
                };

                return safeTotalValue + getFreteValue();
              };

              return formatPrice(calculateTotal());
            })()}
          </span>
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

                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {product.hasPersonalization && (
                      <span className="text-[10px] uppercase bg-blue-600 text-white px-2 py-0.5 rounded">
                        Personalizado
                      </span>
                    )}
                    {product.isAmostra && (
                      <span className="text-[10px] uppercase bg-green-100 text-green-800 font-medium px-2 py-0.5 rounded">
                        Amostra
                      </span>
                    )}
                  </div>

                  <div className="flex items-start gap-2 text-xs">
                    <p className="text-gray-500">Quantidade:</p>
                    <p>{product.quantity}</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    valor produto: {formatPrice(effectivePrices[product.id] || product.unitPriceEffective)}
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
                    Subtotal:{" "}
                    {formatPrice(product.quantity * (effectivePrices[product.id] || product.unitPriceEffective))}
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
