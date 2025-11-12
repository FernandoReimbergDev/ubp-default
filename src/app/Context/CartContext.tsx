"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { loadCartStorage, saveCartStorage, removeCartStorage } from "./storage";
import type { CartContextType, CartItemInput, CartItemPersist } from "../types/cart";
import { recalculateEffectivePrice } from "../utils/priceCalculation";

const CartContext = createContext<CartContextType | undefined>(undefined);

const keyFor = (id: string | number | null) => (id ? `cart_${id}` : "cart_guest");

// Normaliza valores numéricos e garante subtotal consistente
// IMPORTANTE: Esta função recalcula o preço baseado na quantidade atual e faixas de preço
function normalize(item: CartItemInput): CartItemPersist {
  const quantity = Number.isFinite(item.quantity) ? Math.max(1, Math.trunc(item.quantity)) : 1;
  const unitBase = Number(item.unitPriceBase) || 0;
  const unitPers = Number(item.unitPricePersonalization) || 0;

  // Prepara o item para cálculo (preserva informações de faixas de preço)
  const itemForCalculation: CartItemPersist = {
    ...item,
    quantity,
    unitPriceBase: unitBase,
    unitPricePersonalization: unitPers,
    unitPriceEffective: Number.isFinite(item.unitPriceEffective) ? item.unitPriceEffective : unitBase + unitPers,
    subtotal: 0, // será recalculado abaixo
    isAmostra: item.isAmostra || false,
    precos: item.precos,
    qtdMinPro: item.qtdMinPro,
    vluGridPro: item.vluGridPro,
    valorAdicionalAmostraPro: item.valorAdicionalAmostraPro,
    personalization: item.personalization
      ? {
          ...item.personalization,
          precos: item.personalization.precos,
        }
      : undefined,
  };

  // Recalcula o preço efetivo usando as faixas de preço baseado na quantidade atual
  const unitEff = recalculateEffectivePrice(itemForCalculation, quantity);

  return {
    ...itemForCalculation,
    unitPriceEffective: unitEff,
    subtotal: quantity * unitEff,
  };
}

// Carrega JSON seguro
function parsePersist(raw: string | undefined): CartItemPersist[] {
  if (!raw) return [];
  try {
    const arr: unknown = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    // validação estrutural mínima
    const safe = arr
      .map((x) => x as Partial<CartItemPersist>)
      .filter((x): x is CartItemPersist => typeof x?.id === "string" && typeof x?.codPro === "string")
      .map((x) =>
        normalize({
          id: x.id,
          codPro: x.codPro,
          chavePro: x.chavePro ?? "",
          productName: x.productName ?? "Produto",
          alt: x.alt,
          color: x.color ?? "",
          size: x.size,
          unitPriceBase: x.unitPriceBase ?? 0,
          unitPricePersonalization: x.unitPricePersonalization ?? 0,
          unitPriceEffective: x.unitPriceEffective ?? (x.unitPriceBase ?? 0) + (x.unitPricePersonalization ?? 0),
          quantity: Number.isFinite(x.quantity) ? (x.quantity as number) : 1,
          subtotal: x.subtotal ?? 0, // será recalculado em normalize
          hasPersonalization: x.hasPersonalization ?? false,
          isAmostra: x.isAmostra ?? false, // Garante que isAmostra seja mantido
          personalization: x.personalization
            ? {
                chavePersonal: x.personalization.chavePersonal ?? "",
                descricao: x.personalization.descricao ?? "Personalização",
                precoUnitario: Number(x.personalization.precoUnitario ?? 0),
                precoTotal: Number(x.personalization.precoTotal ?? 0),
                precos: x.personalization.precos, // Preserva faixas de preço da personalização
              }
            : undefined,
          // Preserva informações de faixas de preço do produto
          precos: x.precos,
          qtdMinPro: x.qtdMinPro,
          vluGridPro: x.vluGridPro,
          valorAdicionalAmostraPro: x.valorAdicionalAmostraPro,
          peso: x.peso,
          altura: x.altura,
          largura: x.largura,
          comprimento: x.comprimento,
          thumb: x.thumb,
        })
      );
    return safe;
  } catch (error) {
    console.error("Erro ao fazer parse do carrinho:", error);
    return [];
  }
}

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { cliente } = useAuth();
  const userId = cliente?.id ?? null;
  const userKey = keyFor(userId);
  const [cart, setCart] = useState<CartItemPersist[]>([]);
  const [openCart, setOpenCart] = useState(false);
  const [cartReady, setCartReady] = useState(false);
  const persist = useCallback(
    (items: CartItemPersist[]) => {
      saveCartStorage(userKey, JSON.stringify(items));
    },
    [userKey]
  );

  const initializeCart = useCallback(() => {
    setCartReady(false);
    const loaded = parsePersist(loadCartStorage(userKey));
    setCart(loaded);
    setCartReady(true);
  }, [userKey]);

  const addProduct = (product: CartItemInput) => {
    const incoming = normalize(product);
    setCart((prev) => {
      const index = prev.findIndex((p) => p.id === incoming.id);
      let next: CartItemPersist[];
      if (index >= 0) {
        const curr = prev[index];
        const quantity = curr.quantity + incoming.quantity;
        const updated: CartItemPersist = normalize({
          ...curr,
          quantity,
          // mantém preços do item "novo" (recálculo mais atual)
          unitPriceBase: incoming.unitPriceBase,
          unitPricePersonalization: incoming.unitPricePersonalization,
          unitPriceEffective: incoming.unitPriceEffective,
          hasPersonalization: incoming.hasPersonalization,
          isAmostra: incoming.isAmostra, // Mantém a flag de amostra
          personalization: incoming.personalization,
          // Preserva informações de faixas de preço do produto
          precos: incoming.precos ?? curr.precos,
          qtdMinPro: incoming.qtdMinPro ?? curr.qtdMinPro,
          vluGridPro: incoming.vluGridPro ?? curr.vluGridPro,
          valorAdicionalAmostraPro: incoming.valorAdicionalAmostraPro ?? curr.valorAdicionalAmostraPro,
          peso: incoming.peso,
          altura: incoming.altura,
          largura: incoming.largura,
          comprimento: incoming.comprimento,
        });
        next = prev.slice();
        next[index] = updated;
      } else {
        next = prev.concat(incoming);
      }
      persist(next);
      return next;
    });
    setOpenCart(true);
  };

  const updateQuantity = (id: string, quantity: number) => {
    const q = Math.max(1, Math.trunc(quantity));
    setCart((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx < 0) return prev;
      const it = prev[idx];
      // Recalcula o preço unitário efetivo baseado na nova quantidade
      const newUnitPriceEffective = recalculateEffectivePrice(it, q);
      const updated: CartItemPersist = {
        ...it,
        quantity: q,
        unitPriceEffective: newUnitPriceEffective,
        subtotal: q * newUnitPriceEffective,
      };
      const next = prev.slice();
      next[idx] = updated;
      persist(next);
      return next;
    });
  };

  const updateColorOrSize = (id: string, newColor?: string, newSize?: string) => {
    setCart((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx < 0) return prev;
      const old = prev[idx];
      const newId = `${old.codPro}_${newColor ?? old.color}_${newSize ?? old.size ?? "nosize"}_${
        old.personalization?.chavePersonal ?? "std"
      }`;
      if (prev.some((p) => p.id === newId)) return prev;
      const updated: CartItemPersist = { ...old, id: newId, color: newColor ?? old.color, size: newSize ?? old.size };
      const next = prev.slice();
      next[idx] = updated;
      persist(next);
      return next;
    });
  };

  const removeProduct = (id: string) => {
    setCart((prev) => {
      const next = prev.filter((p) => p.id !== id);
      persist(next);
      return next;
    });
  };

  const clearCart = () => {
    setCart([]);
    removeCartStorage(userKey);
  };

  const fetchProductFrete = async (
    purchaseAmount: string,
    stateCode: string,
    city: string,
    zipCode: string,
    weightGrams: string, // Peso em gramas (sem ponto decimal, ex: "6000")
    height: string,
    width: string,
    length: string
  ): Promise<number | undefined> => {
    try {
      // Validação de parâmetros obrigatórios
      if (!purchaseAmount || !stateCode || !city || !zipCode) {
        console.warn("Parâmetros obrigatórios ausentes para cálculo de frete");
        return undefined;
      }

      // Validação de formato do CEP (deve ter 8 dígitos)
      const zipDigits = zipCode.replace(/\D/g, "");
      if (zipDigits.length !== 8) {
        console.warn("CEP inválido para cálculo de frete:", zipCode);
        return undefined;
      }

      // Validação de valores numéricos
      // Peso vem em gramas (string sem ponto decimal, ex: "6000")
      const weightGramsNum = parseInt(weightGrams, 10);
      const heightNum = parseFloat(height);
      const widthNum = parseFloat(width);
      const lengthNum = parseFloat(length);

      if (isNaN(weightGramsNum) || weightGramsNum <= 0) {
        console.warn("Peso inválido para cálculo de frete:", weightGrams);
        return undefined;
      }

      if (
        isNaN(heightNum) ||
        heightNum <= 0 ||
        isNaN(widthNum) ||
        widthNum <= 0 ||
        isNaN(lengthNum) ||
        lengthNum <= 0
      ) {
        console.warn("Dimensões inválidas para cálculo de frete:", { height, width, length });
        return undefined;
      }

      // Normaliza os parâmetros antes de enviar
      const normalizedStateCode = stateCode.toUpperCase().trim();
      const normalizedCity = city.trim();
      const normalizedZipCode = zipDigits;

      // Peso deve ser enviado em gramas, sem ponto decimal
      // Exemplo: "6000" (não "6.00" ou "6000.00")
      const weightString = String(weightGramsNum); // Garante que é string sem ponto decimal

      // Log para debug - verificar se os parâmetros estão corretos
      // console.log("Enviando requisição de frete para API:", {
      //   purchaseAmount,
      //   stateCode: normalizedStateCode,
      //   city: normalizedCity,
      //   zipCode: normalizedZipCode,
      //   weight: weightString, // Peso em gramas, sem ponto decimal
      //   height,
      //   width,
      //   length,
      // });

      // Faz a requisição com timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout

      let response: Response;
      try {
        response = await fetch("/api/send-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reqMethod: "GET",
            reqEndpoint: "/shipping-quote",
            reqHeaders: {
              "X-Environment": "HOMOLOGACAO",
              purchaseAmount,
              stateCode: normalizedStateCode,
              city: normalizedCity,
              zipCode: normalizedZipCode,
              weight: weightString, // Peso em gramas, sem ponto decimal (ex: "6000")
              height,
              width,
              length,
            },
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      // Verifica se a resposta foi bem-sucedida
      if (!response || !response.ok) {
        const statusText = response?.statusText || "Unknown error";
        const status = response?.status || 0;
        console.warn(`Falha ao calcular frete: ${status} ${statusText}`);
        return undefined;
      }

      // Tenta fazer parse do JSON de forma segura
      let data: unknown;
      try {
        data = await response.json();
        // console.log("Resposta da API de frete:", data);
      } catch (parseError) {
        console.error("Erro ao fazer parse da resposta do frete:", parseError);
        return undefined;
      }

      // Validação segura da estrutura da resposta
      if (!data || typeof data !== "object") {
        console.warn("Resposta do frete em formato inválido:", data);
        return undefined;
      }

      // Acessa data.data.result.amount de forma segura
      const dataObj = data as Record<string, unknown>;
      const innerData = dataObj?.data;

      if (!innerData || typeof innerData !== "object") {
        console.warn("Estrutura de dados do frete inválida (data):", dataObj);
        return undefined;
      }

      const innerDataObj = innerData as Record<string, unknown>;
      const result = innerDataObj?.result;

      if (!result || typeof result !== "object") {
        console.warn("Estrutura de dados do frete inválida (result):", innerDataObj);
        return undefined;
      }

      const resultObj = result as Record<string, unknown>;
      const amount = resultObj?.amount;

      // Valida se amount é um número válido
      if (amount === null || amount === undefined) {
        console.warn("Valor do frete não encontrado na resposta");
        return undefined;
      }

      const amountNum = typeof amount === "number" ? amount : parseFloat(String(amount));

      if (isNaN(amountNum) || !Number.isFinite(amountNum)) {
        console.warn("Valor do frete inválido:", amount);
        return undefined;
      }

      // Retorna o valor válido (garantindo que seja >= 0)
      return Math.max(0, amountNum);
    } catch (error: unknown) {
      // Tratamento de erro abortado (timeout ou cancelamento)
      if (error instanceof Error && error.name === "AbortError") {
        console.warn("Consulta de frete cancelada ou timeout");
        return undefined;
      }

      // Tratamento de outros erros
      if (error instanceof Error) {
        console.error("Erro ao calcular frete:", error.message, error);
      } else {
        console.error("Erro desconhecido ao calcular frete:", error);
      }

      return undefined;
    }
  };
  const fetchSendAddress = async (
    userId: number,
    entityTypeShipping: string,
    contactNameShipping: string,
    legalNameShipping: string,
    cpfCnpjShipping: string,
    ieShipping: string,
    emailShipping: string,
    areaCodeShipping: string,
    phoneShipping: string,
    addressIbgeCodeShipping: string,
    zipCodeShipping: string,
    streetNameShipping: string,
    streetNumberShipping: string,
    addressLine2Shipping: string,
    addressNeighborhoodShipping: string,
    addressCityShipping: string,
    addressStateCodeShipping: string
  ): Promise<number | undefined> => {
    try {
      const response = await fetch("/api/send-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reqMethod: "POST",
          reqEndpoint: "/temp-address-shipping",
          reqHeaders: {
            "X-Environment": "HOMOLOGACAO",
            userId,
            entityTypeShipping,
            contactNameShipping,
            legalNameShipping,
            cpfCnpjShipping,
            ieShipping,
            emailShipping,
            areaCodeShipping,
            phoneShipping,
            addressIbgeCodeShipping,
            zipCodeShipping,
            streetNameShipping,
            streetNumberShipping,
            addressLine2Shipping,
            addressNeighborhoodShipping,
            addressCityShipping,
            addressStateCodeShipping,
          },
        }),
      });
      if (!response.ok) {
        throw new Error("Falha ao enviar endereço de entrega do formulario para a api externa.");
      }
      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error("Error ao enviar dados do endereço de entrega:", error);
      return undefined;
    }
  };

  const fetchGetAddress = async (userId: number) => {
    try {
      const response = await fetch("/api/send-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reqMethod: "GET",
          reqEndpoint: "/temp-address-shipping",
          reqHeaders: {
            "X-Environment": "HOMOLOGACAO",
            userId,
          },
        }),
      });
      if (!response.ok) {
        throw new Error("Falha ao requisitar endereço de entrega para a api externa.");
      }
      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error("Error ao pegar dados do endereço de entrega:", error);
      return undefined;
    }
  };

  // load inicial
  useEffect(() => {
    initializeCart();
  }, [initializeCart]);

  // sync entre abas
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === userKey) {
        setCart(parsePersist(e.newValue ?? undefined));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [userKey]);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartReady,
        openCart,
        setOpenCart,
        initializeCart,
        addProduct,
        updateQuantity,
        updateColorOrSize,
        removeProduct,
        clearCart,
        fetchProductFrete,
        fetchSendAddress,
        fetchGetAddress,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de CartProvider");
  return ctx;
};
