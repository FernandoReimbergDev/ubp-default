"use client";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Container } from "../../components/Container";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import Link from "next/link";
import { SkeletonPedido } from "./partials/skeleton";
import { Resumo } from "@/app/components/Resumo";

type Produto = {
  productName: string; color: string; size: string; price: number; images: string[];
};

type EnderecoEntrega = {
  contato_entrega: string; logradouro: string; numero: string; bairro: string;
  municipio: string; uf: string; cep: string;
};

type PedidoPayload = {
  storeId?: string | number;
  userId?: string | number;
  // ... (demais campos, se quiser tipar tudo)
  paymentMethod?: string;
  orderStatus?: string;
  // etc.
} & Record<string, any>;

// -------- Hook seguro para ler o cookie --------
export function usePedidoPayload() {
  const [pedidoPayload, setPedidoPayload] = useState<PedidoPayload | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = Cookies.get("pedidoPayload");
      if (raw) setPedidoPayload(JSON.parse(raw));
    } catch (e) {
      console.error("Falha ao parsear cookie pedidoPayload:", e);
    } finally {
      setReady(true);
    }
  }, []);

  return { pedidoPayload, ready };
}

export default function PedidoSucesso() {
  const router = useRouter();
  const [entrega, setEntrega] = useState<EnderecoEntrega | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState<string>("");

  const { pedidoPayload, ready: payloadReady } = usePedidoPayload();

  // Define o número do pedido primeiro
  useEffect(() => {
    try {
      const saved = Cookies.get("orderNumber");
      if (saved) setOrderId(saved);
      else setOrderId(typeof window !== "undefined" ? `CT-${Date.now().toString(36).toUpperCase()}` : "CT-XXXXXX");
    } catch {
      setOrderId(typeof window !== "undefined" ? `CT-${Date.now().toString(36).toUpperCase()}` : "CT-XXXXXX");
    }
  }, []);

  // Logs só quando existir payload
  useEffect(() => {
    if (!pedidoPayload) return;
    console.log("pedidoPayload (restore)", pedidoPayload);
    // Exemplo: console.log("storeId", pedidoPayload.storeId);
  }, [pedidoPayload]);

  // Callback que só dispara quando tudo estiver pronto
  const fetchCadastroPedido = useCallback(async (signal?: AbortSignal) => {
    if (!pedidoPayload || !orderId) return; // guarda
    try {
      const res = await fetch("/api/send-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reqMethod: "POST",
          reqEndpoint: `/order/${orderId}`,
          reqHeaders: {
            "X-Environment": "HOMOLOGACAO",
            ...pedidoPayload,
          },
        }),
        signal,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result?.message || "Erro ao cadastrar pedido");
      console.log(result);

    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error("Erro ao cadastrar pedido do usuário na API externa:", err);
    }
  }, [pedidoPayload, orderId]);

  // Só chama quando: cookie lido (payloadReady), payload existe e orderId definido
  useEffect(() => {
    if (!payloadReady) return;
    if (!pedidoPayload || !orderId) return;

    const ac = new AbortController();
    fetchCadastroPedido(ac.signal);
    return () => ac.abort();
  }, [payloadReady, pedidoPayload, orderId, fetchCadastroPedido]);

  // Carrega dados do localStorage
  useEffect(() => {
    try {
      const entregaStorage = localStorage.getItem("dadosEntrega");

      if (entregaStorage) setEntrega(JSON.parse(entregaStorage));
    } catch (e) {
      console.error("Falha ao ler localStorage:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const dataPedido = useMemo(() => {
    function adicionarDiasUteis(data: Date, diasUteis: number): Date {
      const nova = new Date(data);
      let add = 0;
      while (add < diasUteis) {
        nova.setDate(nova.getDate() + 1);
        const d = nova.getDay();
        if (d !== 0 && d !== 6) add++;
      }
      return nova;
    }
    const dt = adicionarDiasUteis(new Date(), 7);
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(dt);
  }, []);

  function handleImprimir() { window.print(); }
  function handleNovaCompra() { router.push("/"); }

  if (loading) return <SkeletonPedido />;

  // if (!entrega) {
  //   return (
  //     <div className="min-h-[calc(100dvh-114px)] w-full flex flex-col lg:flex-row bg-body-bg pt-18">
  //       <Container>
  //         <div className="mx-auto max-w-xl w-full bg-white rounded-2xl shadow-md p-10 text-center">
  //           <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-yellow-100 flex items-center justify-center">
  //             <span className="text-yellow-600 text-2xl">!</span>
  //           </div>
  //           <h1 className="text-xl font-semibold text-gray-800 mb-2">Não encontramos os dados da solicitação</h1>
  //           <p className="text-gray-600">Parece que esta página foi acessada sem finalizar a seleção do produto ou os dados de entrega.</p>
  //           <button
  //             onClick={() => router.push("/produtos")}
  //             className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5"
  //           >
  //             Voltar para a loja
  //           </button>
  //         </div>
  //       </Container>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-[calc(100dvh-114px)] w-full flex flex-col lg:flex-row bg-body-bg pt-14">
      <Container>
        <div className="mx-auto max-w-5xl">
          <div className="bg-white rounded-2xl shadow-md p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 mb-6">
            <div className="flex items-center justify-center p-4 rounded-full bg-green-50 shrink-0">
              <div className="flex items-center justify-center h-14 w-14 rounded-full bg-green-500 shrink-0">
                <Check size={32} className="text-white" strokeWidth={4} />
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-green-700">Solicitação realizada com sucesso!</h1>
              <p className="text-gray-600 mt-1">Recebemos sua solicitação e em breve retornaremos.</p>
              <p className="text-red-300 mt-1 text-xs">Essa página é uma demonstração.</p>
              <div className="mt-3 text-sm text-gray-500 flex flex-col sm:flex-row gap-2 sm:gap-4">
                <span><strong>Nº da Solicitação:</strong> {orderId}</span>
                <span className="hidden sm:inline">•</span>
                <span><strong>Previsão de entrega:</strong> {dataPedido}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <button onClick={handleImprimir} className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50 px-3 py-2 text-sm text-gray-700 cursor-pointer">
                Imprimir
              </button>
              <button onClick={() => router.push("/sign-in")} className="inline-flex items-center justify-center rounded-lg bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm cursor-pointer">
                Voltar à loja
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-12 gap-6">
            <section className="md:col-span-7">
              <div className="bg-white rounded-2xl shadow-md p-6 md:p-8 h-full">
                {entrega &&
                  <Resumo delivery={{ stateCode: entrega.uf, city: entrega.municipio, zipCode: entrega.cep }} />
                }
              </div>
            </section>

            <aside className="md:col-span-5">
              <div className="bg-white rounded-2xl shadow-md p-6 md:p-8 h-full">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Dados de entrega</h2>
                <div className="text-gray-700 leading-relaxed space-y-2">
                  <div>
                    <strong className="text-gray-900">Contato para entrega: </strong>
                    <p className="capitalize text-gray-700">
                      {pedidoPayload?.legalNameShipping
                        || pedidoPayload?.contactNameShipping
                        || pedidoPayload?.legalName
                        || pedidoPayload?.legalNameBilling
                        || entrega?.contato_entrega
                      }
                    </p>
                  </div>
                  <p className="text-gray-700"><strong className="text-gray-900">Endereço: </strong>{entrega?.logradouro}- {entrega?.numero} — {entrega?.bairro}</p>
                  <p><strong className="text-gray-900">Cidade/UF: </strong>{entrega?.municipio} — {entrega?.uf}</p>
                  <p><strong className="text-gray-900">CEP: </strong>{entrega?.cep}</p>
                </div>
                <div className="mt-6 rounded-xl bg-green-50 border border-green-100 p-4">
                  <p className="text-sm text-green-800">Sua Solicitação está sendo preparada.</p>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-2 print:hidden">
                  <button onClick={handleImprimir} className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50 px-4 py-2 text-sm text-gray-700 cursor-pointer">
                    Imprimir comprovante
                  </button>
                  <button onClick={handleNovaCompra} className="inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm cursor-pointer">
                    Finalizar
                  </button>
                </div>
              </div>
            </aside>
          </div>

          <div className="mt-8 flex items-center justify-center gap-3 text-sm text-gray-500 print:hidden">
            <span>Precisa de ajuda?</span>
            <Link href={'/fale-conosco'} className="text-blue-600 hover:underline cursor-pointer">Fale conosco</Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
