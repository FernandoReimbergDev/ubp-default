import { Footer } from "../components/Footer";
import { CookiesTerms } from "../components/PoliticaCookiesTerms"
import { CookiesProvider } from "../Context/CookiesContext";
export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CookiesProvider>
      <div>
        {children}
        <Footer />
        <CookiesTerms />
      </div>
    </CookiesProvider>
  );
}
