"use client";
import { useRouter } from "next/navigation";
import { Container } from "../../components/Container";
import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import Link from "next/link";
import { SkeletonPedido } from "./partials/skeleton";
import { Resumo } from "@/app/components/Resumo";

type Produto = {
  productName: string;
  color: string;
  size: string;
  price: number;
  images: string[];
};

type EnderecoEntrega = {
  contato_entrega: string;
  logradouro: string;
  numero: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
};

export default function PedidoSucesso() {
  const router = useRouter();
  const [produto, setProduto] = useState<Produto | null>(null);
  const [entrega, setEntrega] = useState<EnderecoEntrega | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState<string>("");

  // Gera um ID de pedido simples (mock) e data formatada
  useEffect(() => {
    setOrderId(typeof window !== "undefined" ? `CT-${Date.now().toString(36).toUpperCase()}` : "CT-XXXXXX");
  }, []);

  // Carrega dados do localStorage
  useEffect(() => {
    try {
      const produtoStorage = localStorage.getItem("produtoSelecionado");
      const entregaStorage = localStorage.getItem("dadosEntrega");

      if (produtoStorage) setProduto(JSON.parse(produtoStorage));
      if (entregaStorage) setEntrega(JSON.parse(entregaStorage));
    } catch (e) {
      console.error("Falha ao ler localStorage:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const dataPedido = useMemo(() => {
    // Função auxiliar para adicionar dias úteis
    function adicionarDiasUteis(data: Date, diasUteis: number): Date {
      const novaData = new Date(data);
      let diasAdicionados = 0;

      while (diasAdicionados < diasUteis) {
        novaData.setDate(novaData.getDate() + 1);
        const diaSemana = novaData.getDay(); // 0 = domingo, 6 = sábado

        if (diaSemana !== 0 && diaSemana !== 6) {
          diasAdicionados++;
        }
      }

      return novaData;
    }

    // Data atual + 7 dias úteis
    const dataEntrega = adicionarDiasUteis(new Date(), 7);

    // Formata no padrão brasileiro
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "long",
    }).format(dataEntrega);
  }, []);

  function handleImprimir() {
    window.print();
  }

  function handleNovaCompra() {
    // opcional: limpar dados do pedido atual
    // localStorage.removeItem("produtoSelecionado");
    // localStorage.removeItem("dadosEntrega");
    router.push("/");
  }

  // Estado de carregamento (skeleton)
  if (loading) {
    return (
      <SkeletonPedido />
    );
  }

  // Estado sem dados (fallback)
  if (!produto || !entrega) {
    return (
      <div className="min-h-[calc(100dvh-114px)] w-full flex flex-col lg:flex-row bg-body-bg pt-18">
        <Container>
          <div className="mx-auto max-w-xl w-full bg-white rounded-2xl shadow-md p-10 text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-yellow-100 flex items-center justify-center">
              <span className="text-yellow-600 text-2xl">!</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-800 mb-2">Não encontramos os dados da solicitação</h1>
            <p className="text-gray-600">
              Parece que esta página foi acessada sem finalizar a seleção do produto ou os dados de entrega.
            </p>
            <button
              onClick={() => router.push("/produtos")}
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5"
            >
              Voltar para a loja
            </button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-114px)] w-full flex flex-col lg:flex-row bg-body-bg pt-14">
      <Container>
        <div className="mx-auto max-w-5xl">
          {/* Header de sucesso */}
          <div className="bg-white rounded-2xl shadow-md p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 mb-6">
            <div className="flex items-center justify-center h-14 w-14 rounded-full bg-green-100 shrink-0">
              {/* Ícone de sucesso */}
              <Check size={32} className="text-green-800" strokeWidth={4} />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-green-700">Solicitação realizada com sucesso!</h1>
              <p className="text-gray-600 mt-1">Sua solicitação será analisada e em breve retornaremos.</p>
              <p className="text-red-300 mt-1 text-xs">
                Essa pagina é uma demonstração, toda a ação e produtos são somente demonstrativos
              </p>
              <div className="mt-3 text-sm text-gray-500 flex flex-col sm:flex-row gap-2 sm:gap-4">
                <span>
                  <strong>Nº da Solicitação:</strong> {orderId}
                </span>
                <span className="hidden sm:inline">•</span>
                <span>
                  <strong>Previsão de entrega:</strong> {dataPedido}
                </span>
              </div>
            </div>

            {/* Ações principais */}
            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={handleImprimir}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50 px-3 py-2 text-sm text-gray-700 cursor-pointer"
              >
                Imprimir
              </button>
              <button
                onClick={() => router.push("/sign-in")}
                className="inline-flex items-center justify-center rounded-lg bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm cursor-pointer"
              >
                Voltar à loja
              </button>
            </div>
          </div>

          {/* Grid principal */}
          <div className="grid md:grid-cols-12 gap-6">
            {/* Card do Produto */}
            <section className="md:col-span-7">
              <div className="bg-white rounded-2xl shadow-md p-6 md:p-8 h-full">
                <Resumo />
              </div>
            </section>

            {/* Card de Entrega */}
            <aside className="md:col-span-5">
              <div className="bg-white rounded-2xl shadow-md p-6 md:p-8 h-full">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Dados de entrega</h2>
                <div className="text-gray-700 leading-relaxed space-y-2">
                  <div>
                    <strong className="text-gray-900">Contato para entrega: </strong>
                    <p className="capitalize text-gray-700">{entrega.contato_entrega}</p>
                  </div>
                  <p className="text-gray-700">
                    <strong className="text-gray-900">Endereço: </strong>
                    {entrega.logradouro} — {entrega.bairro}
                  </p>
                  <p>
                    <strong className="text-gray-900">Cidade/UF: </strong>
                    {entrega.municipio} — {entrega.uf}
                  </p>
                  <p>
                    <strong className="text-gray-900">CEP: </strong>
                    {entrega.cep}
                  </p>
                </div>

                {/* Ajuda/Status */}
                <div className="mt-6 rounded-xl bg-green-50 border border-green-100 p-4">
                  <p className="text-sm text-green-800">Sua Solicitação está sendo preparada.</p>
                </div>

                {/* CTAs secundárias */}
                <div className="mt-6 flex flex-col sm:flex-row gap-2 print:hidden">
                  <button
                    onClick={handleImprimir}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50 px-4 py-2 text-sm text-gray-700 cursor-pointer"
                  >
                    Imprimir comprovante
                  </button>
                  <button
                    onClick={handleNovaCompra}
                    className="inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm cursor-pointer"
                  >
                    Finalizar
                  </button>
                </div>
              </div>
            </aside>
          </div>

          {/* Rodapé auxiliar (somente tela, não print) */}
          <div className="mt-8 flex items-center justify-center gap-3 text-sm text-gray-500 print:hidden">
            <span>Precisa de ajuda?</span>
            <Link href={'/fale-conosco'} className="text-blue-600 hover:underline cursor-pointer">
              Fale conosco
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
