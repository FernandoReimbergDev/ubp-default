import type { Metadata } from "next";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { ProductsProvider } from "../Context/ProductsContext";
import { CartProvider } from "../Context/CartContext";
import { ToastProvider } from "../Context/ToastProvider";

export const metadata: Metadata = {
  title: "Amil | Unity Brindes",
  description: "Loja Virtual Amil",
};

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProductsProvider>
      <CartProvider>
        <ToastProvider>
          <Header />
          {children}
          <Footer />
        </ToastProvider>
      </CartProvider>
    </ProductsProvider>
  );
}
