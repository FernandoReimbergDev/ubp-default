"use client";
import { AlignJustify, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "../Context/CartContext";
import { LogoHorizontal } from "./LogoHeader";
import MenuNav from "./MenuNav";
import { CartModal } from "./ModalCart";
import { SearchBar } from "./SearchBar";
import { usePathname } from "next/navigation";

export function Header() {
  const [menuNav, setMenuNav] = useState(false);
  const [fixNavbar, setFixNavbar] = useState(false);
  const { cart, openCart, setOpenCart } = useCart();
  const pathname = usePathname();
  const isPedidoPage = pathname === "/pedido";

  function handleCartOpen() {
    if (cart.length > 0) {
      setOpenCart(true);
    }
  }

  function handleCartClose() {
    setOpenCart(false);
  }

  function handleMenuNav() {
    setMenuNav(!menuNav);
  }

  useEffect(() => {
    const handleScroll = () => {
      if (scrollY > 50) {
        setFixNavbar(true);
      } else {
        setFixNavbar(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [fixNavbar]);

  return (
    <>
      <header
        className={`fixed top-0 left-1/2 -translate-x-1/2 w-full z-49 fixNavbar print:hidden ${
          fixNavbar ? "fixNavbar" : ""
        }`}
      >
        <div className="w-full min-h-12 h-fit xl:h-fit xl:max-h-12 flex justify-between items-center py-2 xl:py-4 px-4 bg-Header-bg shadow-lg 2xl:max-w-7xl xl:max-w-5xl xl:mx-auto xl:mt-4 xl:rounded-lg relative">
          <AlignJustify size={28} className="cursor-pointer xl:hidden" onClick={handleMenuNav} />
          <LogoHorizontal />
          <div className="flex items-center gap-4">
            <nav
              className={`w-fit h-fit xl:h-12 rounded-b-lg -translate-x-[100vw] xl:translate-x-0 transition-transform shadow-xl xl:shadow-none flex flex-col xl:flex-row items-start xl:items-center justify-start xl:justify-center min-w-[300px] absolute z-50 xl:relative top-14 xl:top-0 bg-Header-bg p-4 left-0 xl:p-0 ${
                menuNav ? "translate-x-0" : " "
              }`}
            >
              <SearchBar />
              <MenuNav />
            </nav>
            <div className="flex items-center">
              {!isPedidoPage && (
                <div className="relative cursor-pointer z-50" onClick={handleCartOpen}>
                  <ShoppingBag size={28} />
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cart.length}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      {!isPedidoPage && <CartModal handleClick={handleCartClose} isOpen={openCart} />}
    </>
  );
}
