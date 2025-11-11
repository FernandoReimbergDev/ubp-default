"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { loadCartStorage, saveCartStorage, removeCartStorage } from "./storage";
import type { CartContextType, CartItemInput, CartItemPersist } from "../types/cart";

const CartContext = createContext<CartContextType | undefined>(undefined);

const keyFor = (id: string | number | null) => (id ? `cart_${id}` : "cart_guest");

// Normaliza valores numéricos e garante subtotal consistente
function normalize(item: CartItemInput): CartItemPersist {
  const quantity = Number.isFinite(item.quantity) ? Math.max(1, Math.trunc(item.quantity)) : 1;
  const unitBase = Number(item.unitPriceBase) || 0;
  const unitPers = Number(item.unitPricePersonalization) || 0;
  const unitEff = Number.isFinite(item.unitPriceEffective) ? item.unitPriceEffective : unitBase + unitPers;

  return {
    ...item,
    quantity,
    unitPriceBase: unitBase,
    unitPricePersonalization: unitPers,
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
      .map((x) => normalize({
        id: x.id,
        codPro: x.codPro,
        chavePro: x.chavePro,
        productName: x.productName ?? "Produto",
        alt: x.alt,
        color: x.color ?? "",
        size: x.size,
        unitPriceBase: x.unitPriceBase ?? 0,
        unitPricePersonalization: x.unitPricePersonalization ?? 0,
        unitPriceEffective: x.unitPriceEffective ?? (x.unitPriceBase ?? 0) + (x.unitPricePersonalization ?? 0),
        quantity: Number.isFinite(x.quantity) ? (x.quantity as number) : 1,
        subtotal: x.subtotal ?? 0, // será recalculado em normalize
        hasPersonalization: x.hasPersonalization,
        personalization: x.personalization
          ? {
            chavePersonal: x.personalization.chavePersonal,
            descricao: x.personalization.descricao,
            precoUnitario: Number(x.personalization.precoUnitario ?? 0),
            precoTotal: Number(x.personalization.precoTotal ?? 0),
          }
          : undefined,
        peso: x.peso, altura: x.altura, largura: x.largura, comprimento: x.comprimento,
        thumb: x.thumb,
      }));
    return safe;
  } catch {
    return [];
  }
}

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { cliente } = useAuth();
  const userId = cliente?.id ?? null;
  console.log(userId)
  const userKey = keyFor(userId);
  const [cart, setCart] = useState<CartItemPersist[]>([]);
  const [openCart, setOpenCart] = useState(false);
  const [cartReady, setCartReady] = useState(false);
  const persist = useCallback((items: CartItemPersist[]) => {
    saveCartStorage(userKey, JSON.stringify(items));
  }, [userKey]);

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
          personalization: incoming.personalization,
          peso: incoming.peso, altura: incoming.altura, largura: incoming.largura, comprimento: incoming.comprimento,
        });
        next = prev.slice(); next[index] = updated;
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
      const updated: CartItemPersist = { ...it, quantity: q, subtotal: q * it.unitPriceEffective };
      const next = prev.slice(); next[idx] = updated;
      persist(next);
      return next;
    });
  };

  const updateColorOrSize = (id: string, newColor?: string, newSize?: string) => {
    setCart((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx < 0) return prev;
      const old = prev[idx];
      const newId = `${old.codPro}_${newColor ?? old.color}_${newSize ?? old.size ?? "nosize"}_${old.personalization?.chavePersonal ?? "std"}`;
      if (prev.some((p) => p.id === newId)) return prev;
      const updated: CartItemPersist = { ...old, id: newId, color: newColor ?? old.color, size: newSize ?? old.size };
      const next = prev.slice(); next[idx] = updated;
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
    weight: string,
    height: string,
    width: string,
    length: string
  ): Promise<number | undefined> => {
    try {
      const response = await fetch("/api/send-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reqMethod: "GET",
          reqEndpoint: "/shipping-quote",
          reqHeaders: {
            "X-Environment": "HOMOLOGACAO",
            storeId: "32",
            purchaseAmount,
            stateCode,
            city,
            zipCode,
            weight,
            height,
            width,
            length,
          },
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to calculate shipping');
      }
      const data = await response.json();
      return data.data.result.amount;
    } catch (error) {
      console.error('Error calculating shipping:', error);
      return undefined;
    }
  };
  const fetchSendAddress = async (
    userId: number,
    entityTypeShipping: string,
    contactNameShipping: string,
    legalNameShipping: string,
    cpfCnpfShipping: string,
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
            cpfCnpfShipping,
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
        throw new Error('Falha ao enviar endereço de entrega do formulario para a api externa.');
      }
      const data = await response.json();
      console.log(data)
      return data.result;
    } catch (error) {
      console.error('Error ao enviar dados do endereço de entrega:', error);
      return undefined;
    }
  };

  const fetchGetAddress = async (
    userId: number,
  ) => {
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
        throw new Error('Falha ao requisitar endereço de entrega para a api externa.');
      }
      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Error ao pegar dados do endereço de entrega:', error);
      return undefined;
    }
  };

  // load inicial
  useEffect(() => { initializeCart(); }, [initializeCart]);

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
    <CartContext.Provider value={{
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
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de CartProvider");
  return ctx;
};
