/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Container } from "../../components/Container";
import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import Link from "next/link";
import { SkeletonPedido } from "./partials/skeleton";
import { useCart } from "@/app/Context/CartContext";
import { formatCep } from "@/app/services/utils";
import { formatPrice } from "@/app/utils/formatter";
import { useAuth } from "@/app/Context/AuthContext";
import { CartGuard } from "@/app/components/CartGuard";
import { FileSearch2, ShoppingCart } from "lucide-react";

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

  // -------- Previne voltar para páginas anteriores do checkout --------
  useEffect(() => {
    // Intercepta o evento de voltar do navegador
    const handlePopState = () => {
      // Quando o usuário clicar em voltar, redireciona para home
      router.replace("/");
    };

    // Adiciona home como entrada anterior no histórico
    // Isso garante que ao clicar em voltar, vá para home ao invés das páginas do checkout
    window.history.pushState(null, "", "/");
    window.history.pushState(null, "", "/pedido");

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [router]);

  // -------- Busca os dados do payload do temp-storage usando jti --------
  useEffect(() => {
    async function fetchPedido() {
      try {
        // Busca o orderNumber do cookie para exibir na página
        const savedOrderId = Cookies.get("orderNumber");
        if (savedOrderId) {
          setOrderId(savedOrderId);
        }

        // PRIORIDADE: Busca os dados do temp-storage usando jti
        const jti = await getJti();
        if (!jti) {
          throw new Error("Não foi possível obter o JTI do token");
        }

        // Limpa o carrinho ANTES de redirecionar (mas após garantir o cookie)
        clearCart();

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
        // Se falhar, tenta buscar da API como fallback (se a rota existir)
        if (orderId) {
          try {
            const fallbackResponse = await fetch(`/api/order/${orderId}`);
            if (fallbackResponse.ok) {
              const fallbackResult = await fallbackResponse.json();
              if (fallbackResult.success && fallbackResult.data) {
                const orderData =
                  fallbackResult.data?.result?.[0] || fallbackResult.data?.result || fallbackResult.data;
                if (orderData) {
                  setPedidoPayload(orderData);
                }
              }
            }
          } catch (fallbackError) {
            console.error("[PedidoSucesso] Erro ao buscar da API como fallback:", fallbackError);
          }
        }
      } finally {
        setLoading(false);
      }
    }

    fetchPedido();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Componente ResumoPedido que usa dados fixos do payload
  function ResumoPedido({ pedidoPayload }: { pedidoPayload: PedidoPayload }) {
    const totalProducts = Number(pedidoPayload.totalProductsAmount || 0);
    const totalShipping = Number(pedidoPayload.totalShippingAmount || 0);
    const totalOrder = Number(pedidoPayload.orderTotalAmount || 0);
    const products = Array.isArray(pedidoPayload.products) ? pedidoPayload.products : [];

    return (
      <div className="space-y-4 w-full">
        <h2 className="flex gap-1 items-center text-lg font-semibold text-primary mt-2 lg:mt-0">
          <FileSearch2 size={18} />
          Resumo
        </h2>

        <div className="w-full flex justify-between items-center">
          <p>Valor dos Produtos:</p>
          <span>{formatPrice(totalProducts)}</span>
        </div>

        <div className="w-full flex justify-between items-center">
          <p>Valor do Frete:</p>
          <span>{formatPrice(totalShipping)}</span>
        </div>

        {totalShipping === 0 && (
          <p className="text-[11px] text-green-700">* Frete gratuito para compras acima de R$ 1.500,00</p>
        )}

        <hr className="text-gray-300" />

        <div>
          <div className="bg-green-300 flex justify-between items-center px-2 py-4">
            <p className="text-sm">Valor Total:</p>
            <span>{formatPrice(totalOrder)}</span>
          </div>
        </div>

        <hr className="text-gray-300" />

        <h2 className="flex gap-1 items-center text-lg font-semibold text-primary">
          <ShoppingCart size={18} />
          Produtos
        </h2>

        <div className="w-full h-[310px] scrollbar overflow-x-hidden overflow-y-auto flex flex-col justify-start">
          {products.length > 0 ? (
            products.map((product: any, index: number) => (
              <div key={product.chavePro || product.codPro || index} className="w-full">
                <div className="flex bg-white py-3 px-1 rounded-xl w-full items-start gap-2 relative bg-whiteReference">
                  <div className="w-16 h-16 overflow-hidden rounded-lg min-w-16 shadow-lg flex justify-center items-center">
                    <div className="w-[70px] h-[70px] flex items-center justify-center text-[10px] bg-gray-100 text-gray-500">
                      {product.descrPro || "Produto"}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 px-2">
                    <p className="text-xs 2xl:text-sm font-Roboto text-blackReference line-clamp-2 overflow-hidden w-full">
                      {product.descrPro || "Produto"}
                    </p>

                    {product.personals && Array.isArray(product.personals) && product.personals.length > 0 && (
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] uppercase bg-blue-600 text-white px-2 py-0.5 rounded">
                          Personalizado
                        </span>
                      </div>
                    )}

                    <div className="flex items-start gap-2 text-xs">
                      <p className="text-gray-500">Quantidade:</p>
                      <p>{product.quantityPro || product.quantity || 1}</p>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      valor produto: {formatPrice(Number(product.unitPricePro || product.unitPriceEffective || 0))}
                    </div>

                    {product.descrProCor && (
                      <div className="flex items-start gap-2 text-xs">
                        <p className="text-gray-500">Cor:</p>
                        <p>{product.descrProCor}</p>
                      </div>
                    )}

                    {product.descrProTam && (
                      <div className="flex items-center gap-2 text-xs">
                        <p className="text-gray-500">Tamanho:</p>
                        <p>{product.descrProTam}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs">
                      Subtotal: {formatPrice(Number(product.totalProductAmount || product.subtotal || 0))}
                    </div>
                  </div>
                </div>

                <hr className="border w-full text-gray-300" />
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">Nenhum produto encontrado</div>
          )}
        </div>
      </div>
    );
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
                  {pedidoPayload ? (
                    <ResumoPedido pedidoPayload={pedidoPayload} />
                  ) : (
                    <div className="text-center text-gray-500 py-8">Carregando dados do pedido...</div>
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
