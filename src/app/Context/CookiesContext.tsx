"use client";
import { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";

type CookiesContextType = {
  cookieConsent: boolean;
  acceptCookies: () => void;
  isLoaded: boolean;
};

const CookiesContext = createContext<CookiesContextType | undefined>(undefined);

export function CookiesProvider({ children }: { children: React.ReactNode }) {
  const [cookieConsent, setCookieConsent] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const consent = Cookies.get("cookieConsent");
    if (consent === "true") {
      setCookieConsent(true);
    }
    setIsLoaded(true);
  }, []);

  const acceptCookies = () => {
    Cookies.set("cookieConsent", "true", { expires: 365 });
    setCookieConsent(true);
  };

  return (
    <CookiesContext.Provider value={{ cookieConsent, acceptCookies, isLoaded }}>{children}</CookiesContext.Provider>
  );
}

export const useCookiesConsent = () => {
  const context = useContext(CookiesContext);
  if (!context) throw new Error("useCookiesConsent must be used inside a CookiesProvider");
  return context;
};
