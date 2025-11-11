// ProductsContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { ProductsContextType, Produto } from "../types/responseTypes";

export interface ProdutosResponse {
  success: boolean;
  message: string;
  result: Produto[];
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const ProductsProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Produto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/send-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reqMethod: "GET",
          reqEndpoint: "/products",
          reqHeaders: {
            "X-Environment": "HOMOLOGACAO",
            landingPagePro: "1",
            disponivelProCor: "1",
          },
        }),
        signal,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Erro ao buscar produtos");
      }
      setProducts(result.data.result);
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      console.error("error ao requisitar produtos para api externa", error);
      setError(error instanceof Error ? error.message : "Erro ao buscar produtos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <ProductsContext.Provider value={{ products, loading, error, fetchProducts }}>{children}</ProductsContext.Provider>
  );
};

// export const ProductsProvider = ({ children }: { children: ReactNode }) => {
//   const [products, setProducts] = useState<Produto[]>([]);
//   const [loading, setLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);

//   const fetchProducts = useCallback(async (signal?: AbortSignal) => {
//     setLoading(true);
//     setError(null);
//     try {
//       const res = await fetch("/api/products", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         signal,
//       });

//       const result = await res.json();

//       if (!res.ok) {
//         throw new Error(result.message || "Erro ao buscar produtos");
//       }

//       setProducts(result.data.result);
//     } catch (error: unknown) {
//       if (error instanceof DOMException && error.name === "AbortError") {
//         return;
//       }
//       console.error("error ao requisitar produtos para api externa", error);
//       setError(error instanceof Error ? error.message : "Erro ao buscar produtos");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchProducts();
//   }, [fetchProducts]);

//   return (
//     <ProductsContext.Provider value={{ products, loading, error, fetchProducts }}>{children}</ProductsContext.Provider>
//   );
// };

export const useProducts = (): ProductsContextType => {
  const context = useContext(ProductsContext);
  if (!context) throw new Error("useProducts deve ser usado dentro de ProductsProvider");
  return context;
};
