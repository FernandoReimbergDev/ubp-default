import { Container } from "@/app/components/Container";
import { ShieldX } from "lucide-react";
import Link from "next/link";

export default function NotAutorized() {
  return (
    <div className="min-h-[calc(100dvh-114px)] w-full flex flex-col lg:flex-row bg-body-bg pt-16">
      <Container>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="mb-8">
            <ShieldX size={120} className="text-red-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Acesso Negado</h1>
            <p className="text-lg text-gray-600 mb-8">Você não tem permissão para acessar esta página.</p>
          </div>

          <div className="space-y-4">
            <p className="text-gray-500">
              Entre em contato com o administrador se você acredita que deveria ter acesso a esta área.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Voltar ao Início
              </Link>

              <Link
                href="/sign-in"
                className="px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
              >
                Fazer Login
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
