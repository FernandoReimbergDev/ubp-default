import type { Metadata } from "next";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { ProductsProvider } from "../Context/ProductsContext";
import { CartProvider } from "../Context/CartContext";
import { ToastProvider } from "../Context/ToastProvider";

export const metadata: Metadata = {
  title: "Caixa Vida e Previdência Store | Unity Brindes",
  description: "Loja Virtual Caixa Vida e Previdência",
};

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ToastProvider>
      <ProductsProvider>
        <CartProvider>
          <Header />
          {children}
          <Footer />
        </CartProvider>
      </ProductsProvider>
    </ToastProvider>
  );
}
