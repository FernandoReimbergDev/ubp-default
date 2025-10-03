'use client'
import { Button } from "./Button";
import { useCookiesConsent } from "../Context/CookiesContext";
import Link from "next/link";

export function CookiesTerms() {
    const { cookieConsent, acceptCookies, isLoaded } = useCookiesConsent();

    // 🟡 Enquanto não carregou o cookie, não renderiza nada
    if (!isLoaded) return null;

    // ✅ Só mostra se ainda não aceitou
    if (cookieConsent) return null;

    return (
        <div className="w-full h-full fixed bottom-0 bg-black/40 flex justify-center items-end z-50">
            <div className="h-fit w-full bg-politicaCookiesTerms-bg flex flex-col md:flex-row items-center gap-4 p-6 md:px-16 py-8">
                <p className="text-politicaCookiesTerms-text leading-8">
                    Nós usamos cookies e outras tecnologias semelhantes para melhorar a sua experiência em nossos serviços. Ao utilizar nossos serviços, você está ciente dessa funcionalidade. Informamos ainda que atualizamos nosso Aviso de Privacidade. Conheça nosso Página de Política de Privacidade. <Link className="underline font-bold text-nowrap lg:ml-4" href={"/politica-de-cookies"}>Ver politica de cookies</Link>
                </p>
                <div>
                    <Button
                        className="bg-politicaCookiesTerms-button hover:bg-politicaCookiesTerms-hoverButton text-politicaCookiesTerms-textButton cursor-pointer px-4 py-2 rounded-lg"
                        onClick={acceptCookies}
                    >
                        Prosseguir
                    </Button>
                </div>
            </div>
        </div>
    );
}
