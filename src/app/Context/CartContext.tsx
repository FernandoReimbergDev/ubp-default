
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import Cookies from "js-cookie";
import { CartContextType, ProdutoCart, ProdutoEstoqueResponse } from "../types/responseTypes";
import { useAuth } from "./AuthContext";

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { cliente } = useAuth();
  const userId = cliente?.id || null;

  const userKey = userId ? `cart_${userId}` : "cart_guest";

  const [cart, setCart] = useState<ProdutoCart[]>([]);
  const [openCart, setOpenCart] = useState(false);
  const [cartReady, setCartReady] = useState(false);
  const safeParseCart = (raw?: string): ProdutoCart[] => {
    if (!raw) return [];
    try { return JSON.parse(raw) as ProdutoCart[]; } catch { return []; }
  };

  const initializeCart = useCallback(async () => {
    setCartReady(false);
    // Carrega carrinho do usuário OU do convidado, sem mesclar
    const isLogged = Boolean(userId);
    const keyToLoad = isLogged ? userKey : "cart_guest";
    const raw = Cookies.get(keyToLoad);

    const localCart: ProdutoCart[] = safeParseCart(raw);

    try {
      const controller = new AbortController();
      const validations = await Promise.allSettled(
        localCart.map(async (item) => {
          // Se o produto não tem estoque controlado, não consultar API de estoque
          if (item?.estControl && item.estControl !== "1") {
            return true;
          }

          const res = await fetch("/api/send-request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reqMethod: "GET",
              reqEndpoint: `/product-stock/${item.chavePro}`,
              reqHeaders: {
                "X-Environment": "HOMOLOGACAO",
                storeId: "32",
                landingPagePro: "1",
                disponivelProCor: "1",
                descrProCor: item.color,
                descrProTamanho: item.size || "",
                peso: item.peso ?? "",
                altura: item.altura ?? "",
                largura: item.largura ?? "",
                comprimento: item.comprimento ?? ""
              },
            }),
            signal: controller.signal,
          });
          const result: { data: ProdutoEstoqueResponse } = await res.json();
          if (!res.ok) throw new Error(result.data?.message || "Falha na validação de estoque");
          return result.data.result?.[0];
        })
      );

      const allOk = validations.every((v) => v.status === "fulfilled");
      setCart(localCart);
      try { Cookies.set(keyToLoad, JSON.stringify(localCart), { expires: 7, sameSite: "Lax", path: "/" }); } catch { }
      if (!allOk) {
        // no-op
      }
    } catch {
      setCart((prev) => (Array.isArray(prev) && prev.length ? prev : []));
    } finally {
      setCartReady(true);
    }
  }, [userId, userKey]);

  type FreteEnvelope =
    | { success: boolean; message: string; result: { amount: string | number; percent: string | number } }
    | { success: boolean; data: { success: boolean; message: string; result: { amount: string | number; percent: string | number } } };

  function parseNumBR(val: unknown): number {
    if (val == null) return NaN;
    const s = String(val).trim();
    if (!s) return NaN;
    if (s.includes(".") && s.includes(",")) return Number(s.replace(/\./g, "").replace(",", "."));
    if (s.includes(",")) return Number(s.replace(",", "."));
    return Number(s);
  }


  const generateCartItemId = (codPro: string, color: string, size?: string, personalizationKey?: string): string =>
    `${codPro}_${color}_${size ?? "nosize"}_${personalizationKey ?? "std"}`;

  const addProduct = (product: ProdutoCart) => {
    const parsedQuantity = parseInt(product.quantity, 10);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) return;
    const personalizationKey = product.personalization?.fileName
      ? `pers-${product.personalization.fileName.replace(/\s+/g, "-").slice(0, 50)}`
      : "std";
    const id = generateCartItemId(product.codPro, product.color, product.size, personalizationKey);
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === id);
      let updatedCart;
      if (existingItem) {
        const updatedItem = {
          ...existingItem,
          quantity: String(parseInt(existingItem.quantity, 10) + parsedQuantity),
          subtotal: (parseInt(existingItem.quantity, 10) + parsedQuantity) * existingItem.price,
          peso: product.peso,
          altura: product.altura,
          largura: product.largura,
          comprimento: product.comprimento,
        };
        updatedCart = prevCart.map((item) => (item.id === id ? updatedItem : item));
      } else {
        const newItem = {
          ...product,
          id,
          quantity: String(parsedQuantity),
          subtotal: parsedQuantity * product.price,
          cores: product.cores,
          tamanhos: product.tamanhos,
          peso: product.peso,
          altura: product.altura,
          largura: product.largura,
          comprimento: product.comprimento,
        };
        updatedCart = [...prevCart, newItem];
      }
      try { Cookies.set(userKey, JSON.stringify(updatedCart), { expires: 7, sameSite: "Lax", path: "/" }); } catch { }
      setOpenCart(true);
      return updatedCart;
    });
  };

  const updateQuantity = (id: string, quantity: string | number) => {
    const parsedQuantity = typeof quantity === "string" ? parseInt(quantity, 10) : quantity;
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) return;
    setCart((prevCart) => {
      const index = prevCart.findIndex((item) => item.id === id);
      if (index === -1) return prevCart;
      const updatedItem = {
        ...prevCart[index],
        quantity: String(parsedQuantity),
        subtotal: parsedQuantity * prevCart[index].price,
        cores: prevCart[index].cores,
        tamanhos: prevCart[index].tamanhos,
        peso: prevCart[index].peso,
        altura: prevCart[index].altura,
        largura: prevCart[index].largura,
        comprimento: prevCart[index].comprimento,
      };
      const updatedCart = [...prevCart];
      updatedCart[index] = updatedItem;
      Cookies.set(userKey, JSON.stringify(updatedCart), { expires: 7 });
      setOpenCart(true);
      return updatedCart;
    });
  };

  const removeProduct = (id: string) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.filter((item) => item.id !== id);
      Cookies.set(userKey, JSON.stringify(updatedCart), { expires: 7 });
      return updatedCart;
    });
  };

  const updateColorOrSize = (id: string, newColor?: string, newSize?: string) => {
    setCart((prevCart) => {
      const index = prevCart.findIndex((item) => item.id === id);
      if (index === -1) return prevCart;
      const oldItem = prevCart[index];
      const personalizationKey = oldItem.personalization?.fileName
        ? `pers-${oldItem.personalization.fileName.replace(/\s+/g, "-").slice(0, 50)}`
        : "std";
      const newId = generateCartItemId(
        oldItem.codPro,
        newColor ?? oldItem.color,
        newSize ?? oldItem.size,
        personalizationKey
      );
      if (prevCart.some((item) => item.id === newId)) return prevCart;
      const updatedItem = {
        ...oldItem,
        id: newId,
        color: newColor ?? oldItem.color,
        size: newSize ?? oldItem.size,
      };
      const updatedCart = [...prevCart];
      updatedCart.splice(index, 1, updatedItem);
      Cookies.set(userKey, JSON.stringify(updatedCart), { expires: 7 });
      return updatedCart;
    });
  };


  const fetchProductFrete = async (
    purchaseAmount: string,
    stateCode: string,
    city: string,
    zipCode: string,
    weight: string,
    height: string,
    width: string,
    length: string,
    signal?: AbortSignal
  ): Promise<number | undefined> => {
    try {
      const res = await fetch("/api/send-request", {
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
        signal,
      });

      const payload: FreteEnvelope = await res.json();

      // aceita { success, result } ou { success, data: { result } }
      const resultNode =
        // @ts-expect-error narrow runtime
        (payload?.data?.result as any) ??
        // @ts-expect-error narrow runtime
        (payload?.result as any);

      const amountNum = parseNumBR(resultNode?.amount);
      const percentNum = parseNumBR(resultNode?.percent);

      if (!res.ok || !Number.isFinite(amountNum) || !Number.isFinite(percentNum)) {
        throw new Error(
          `Resposta inválida do frete (status=${res.status}) amount=${resultNode?.amount} percent=${resultNode?.percent}`
        );
      }

      return amountNum;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return undefined;
      console.error("Erro ao consultar frete:", err);
      return undefined;
    }
  };


  const clearCart = () => {
    setCart([]);
    try { Cookies.remove(userKey, { path: "/" }); } catch { }
  };

  useEffect(() => {
    // Sempre (re)carrega o carrinho do cookie ao mudar o contexto de usuário
    // - Logado: mescla guest -> user
    // - Convidado: carrega cart_guest
    initializeCart();
  }, [userId, userKey, initializeCart]);

  // Salvaguarda: se o userId mudar de definido -> null (expiração de sessão, logout fora do fluxo),
  // copie o carrinho em memória para o cookie de convidado antes de recarregar.
  // Sem cópias automáticas entre perfis; apenas reidratamos conforme o contexto atual
  const prevUserIdRef = useRef<string | number | null>(null);
  useEffect(() => {
    prevUserIdRef.current = userId;
  }, [userId]);

  return (
    <CartContext.Provider
      value={{
        cart,
        initializeCart,
        addProduct,
        removeProduct,
        updateQuantity,
        clearCart,
        updateColorOrSize,
        openCart,
        setOpenCart,
        fetchProductFrete,
        cartReady
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart deve ser usado dentro de CartProvider");
  return context;
};
