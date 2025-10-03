"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { CartContextType, ProdutoCart } from "../types/responseTypes";
import { useAuth } from "./AuthContext";

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { cliente } = useAuth();
  const userId = cliente?.id || null;

  const userKey = userId ? `cart_${userId}` : "cart_guest";

  const [cart, setCart] = useState<ProdutoCart[]>([]);
  const [openCart, setOpenCart] = useState(false);

  const initializeCart = useCallback(async () => {
    const stored = Cookies.get(userKey);
    if (stored) {
      const localCart: ProdutoCart[] = JSON.parse(stored);
      try {
        const response = await axios.post("/api/validates-estoque", { produtos: localCart });
        if (response.data.success) {
          setCart(localCart);
          Cookies.set(userKey, JSON.stringify(localCart), { expires: 7 });
        } else {
          setCart([]);
          Cookies.remove(userKey);
        }
      } catch {
        setCart([]);
      }
    }
  }, [userKey]);

  const generateCartItemId = (codPro: string, color: string, size?: string): string =>
    `${codPro}_${color}_${size ?? "nosize"}`;

  const addProduct = (product: ProdutoCart) => {
    const parsedQuantity = parseInt(product.quantity, 10);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) return;
    const id = generateCartItemId(product.codPro, product.color, product.size);
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === id);
      let updatedCart;
      if (existingItem) {
        const updatedItem = {
          ...existingItem,
          quantity: String(parseInt(existingItem.quantity, 10) + parsedQuantity),
          subtotal: (parseInt(existingItem.quantity, 10) + parsedQuantity) * existingItem.price,
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
        };
        updatedCart = [...prevCart, newItem];
      }
      Cookies.set(userKey, JSON.stringify(updatedCart), { expires: 7 });
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
      const newId = generateCartItemId(oldItem.codPro, newColor ?? oldItem.color, newSize ?? oldItem.size);
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

  const clearCart = () => {
    setCart([]);
    Cookies.remove(userKey);
  };

  useEffect(() => {
    if (!userId) {
      setCart([]);
      Cookies.remove(userKey);
      return;
    }

    initializeCart();
  }, [userId, userKey, initializeCart]);

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
