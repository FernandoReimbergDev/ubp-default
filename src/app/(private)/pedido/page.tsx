/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Container } from "../../components/Container";
import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import Link from "next/link";
import { SkeletonPedido } from "./partials/skeleton";
import { Resumo } from "@/app/components/Resumo";
import { useCart } from "@/app/Context/CartContext";
import { formatCep } from "@/app/services/utils";
import { useAuth } from "@/app/Context/AuthContext";
import { CartGuard } from "@/app/components/CartGuard";

type EnderecoEntrega = {
  contato_entrega: string;
  logradouro: string;
  numero: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
};

type PedidoPayload = {
  storeId?: string | number;
  userId?: string | number;
  // ... (demais campos, se quiser tipar tudo)
  paymentMethod?: string;
  orderStatus?: string;
  // etc.
} & Record<string, any>;

export default function PedidoSucesso() {
  const { hasAnyRole, getJti } = useAuth();
  const router = useRouter();
  const { clearCart } = useCart();
  const [entrega, setEntrega] = useState<EnderecoEntrega | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState<string>("");
  const [pedidoPayload, setPedidoPayload] = useState<PedidoPayload | null>(null);

  // -------- Busca o payload do temp-storage usando jti --------
  useEffect(() => {
    async function fetchPedido() {
      try {
        // Busca o orderNumber do cookie para exibir na página
        const savedOrderId = Cookies.get("orderNumber");
        if (savedOrderId) {
          setOrderId(savedOrderId);
        }

        // Obtém o jti do token
        const jti = await getJti();
        if (!jti) {
          throw new Error("Não foi possível obter o JTI do token");
        }

        // Busca os dados do temp-storage usando send-request
        const response = await fetch("/api/send-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reqMethod: "GET",
            reqEndpoint: "/temp-storage",
            reqHeaders: {
              "X-Environment": "HOMOLOGACAO",
              storageId: jti,
            },
          }),
        });

        if (!response.ok) {
          throw new Error("Falha ao buscar dados do temp-storage interno");
        }

        const data = await response.json();
        if (!data.success || !data.data?.success) {
          throw new Error(data.data?.message || "Erro ao buscar dados do temp-storage externo");
        }

        // Extrai o conteúdo do payload
        const payloadContent = data.data.result?.content;
        if (payloadContent) {
          setPedidoPayload(payloadContent);
        }
      } catch (error) {
        console.error("[PedidoSucesso] Erro ao buscar payload do storage:", error);
        // Não usa localStorage para evitar expor dados sensíveis
        // Se a API falhar, a página não mostrará os dados do pedido
      } finally {
        setLoading(false);
      }
    }

    fetchPedido();
  }, [getJti]);

  // Logs só quando existir payload
  useEffect(() => {
    if (!pedidoPayload) return;
  }, [pedidoPayload]);

  // Carrega dados de entrega do pedidoPayload
  useEffect(() => {
    try {
      // Deriva do pedidoPayload (shipping > billing)
      if (pedidoPayload) {
        const pick = (...vals: any[]) => {
          for (const v of vals) if (v != null && String(v).trim() !== "") return String(v);
          return "";
        };
        const digits = (s: string) => s.replace(/\D+/g, "");
        const upper = (s: string) => s.toUpperCase();

        const entregaDerivada: EnderecoEntrega = {
          contato_entrega: pick(
            pedidoPayload.legalNameShipping,
            pedidoPayload.contactNameShipping,
            pedidoPayload.legalName,
            pedidoPayload.legalNameBilling
          ),
          logradouro: pick(pedidoPayload.streetNameShipping, pedidoPayload.streetNameBilling),
          numero: pick(pedidoPayload.streetNumberShipping, pedidoPayload.streetNumberBilling),
          bairro: pick(pedidoPayload.addressNeighborhoodShipping, pedidoPayload.addressNeighborhoodBilling),
          municipio: pick(pedidoPayload.addressCityShipping, pedidoPayload.addressCityBilling),
          uf: upper(pick(pedidoPayload.addressStateCodeShipping, pedidoPayload.addressStateCodeBilling)),
          cep: digits(pick(pedidoPayload.zipCodeShipping, pedidoPayload.zipCodeBilling)),
        };

        const zipOk = entregaDerivada.cep?.length === 8;
        const ufOk = Boolean(entregaDerivada.uf);
        const cityOk = Boolean(entregaDerivada.municipio);
        if (zipOk && ufOk && cityOk) {
          setEntrega(entregaDerivada);
        }
      }
    } catch (e) {
      console.error("Falha ao preparar dados de entrega:", e);
    }
  }, [pedidoPayload]);

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

  const handleNovaCompra = () => {
    clearCart();
    router.push("/");
  };

  function handleImprimir() {
    window.print();
  }

  if (loading) return <SkeletonPedido />;

  return (
    <CartGuard allowEmptyWithPayload>
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
                <p className="text-red-300 mt-1 text-sm italic">Esse sistema é somente demonstrativo.</p>
                {!hasAnyRole(["Administrador"]) && (
                  <>
                    <p className="text-gray-500 mt-1 text-sm italic">
                      O estoque será reservado por até 48 horas. Após esse período, caso o pedido ainda esteja
                      aguardando aprovação, a reserva será automaticamente cancelada e o estoque será liberado.
                    </p>
                    <p className="text-gray-500 mt-1 text-sm italic">
                      O prazo de entrega é estimado e poderá ser alterado conforme as aprovações do pedido e da amostra
                      virtual, quando aplicável.
                    </p>
                  </>
                )}
                <div className="mt-3 text-sm text-gray-500 flex flex-col sm:flex-row gap-2 sm:gap-4 w-full">
                  <span>
                    <strong>Nº da Solicitação:</strong> {orderId}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span>
                    <strong>Previsão de entrega:</strong> {dataPedido}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={handleImprimir}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50 px-3 py-2 text-sm text-gray-700 cursor-pointer"
                >
                  Imprimir
                </button>
                <button
                  onClick={handleNovaCompra}
                  className="inline-flex items-center justify-center rounded-lg bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm cursor-pointer"
                >
                  Voltar à loja
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-12 gap-6">
              <section className="md:col-span-7">
                <div className="bg-white rounded-2xl shadow-md p-6 md:p-8 h-full">
                  {entrega && (
                    <Resumo delivery={{ stateCode: entrega.uf, city: entrega.municipio, zipCode: entrega.cep }} />
                  )}
                </div>
              </section>

              <aside className="md:col-span-5">
                <div className="bg-white rounded-2xl shadow-md p-6 md:p-8 h-full">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Dados de entrega</h2>
                  <div className="text-gray-700 leading-relaxed space-y-2">
                    <div>
                      <strong className="text-gray-900">Contato para entrega: </strong>
                      <p className="capitalize text-gray-700">
                        {pedidoPayload?.contactNameShipping || entrega?.contato_entrega}
                      </p>
                    </div>
                    <p className="text-gray-700">
                      <strong className="text-gray-900">Endereço: </strong>
                      {entrega?.logradouro}- {entrega?.numero} — {entrega?.bairro}
                    </p>
                    <p>
                      <strong className="text-gray-900">Cidade/UF: </strong>
                      {entrega?.municipio} — {entrega?.uf}
                    </p>
                    <p>
                      <strong className="text-gray-900">CEP: </strong>
                      {formatCep(entrega?.cep)}
                    </p>
                  </div>
                  <div className="mt-6 rounded-xl bg-green-50 border border-green-100 p-4">
                    <p className="text-sm text-green-800">Sua Solicitação está sendo preparada.</p>
                  </div>
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

            <div className="mt-8 flex items-center justify-center gap-3 text-sm text-gray-500 print:hidden">
              <span>Precisa de ajuda?</span>
              <Link href={"/fale-conosco"} className="text-blue-600 hover:underline cursor-pointer">
                Fale conosco
              </Link>
            </div>
          </div>
        </Container>
      </div>
    </CartGuard>
  );
}
