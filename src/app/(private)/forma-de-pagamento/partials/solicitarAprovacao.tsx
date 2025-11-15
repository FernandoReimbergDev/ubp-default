/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useAuth } from "@/app/Context/AuthContext";
import { useCart } from "@/app/Context/CartContext";
import { Resumo } from "@/app/components/Resumo";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useCallback, useEffect, useMemo, useState } from "react";

export function SolicitarAprovacao() {
  const { hasAnyRole, fetchOrderNumber, getJti } = useAuth();
  const { cart, clearCart } = useCart();
  const isAdmin = hasAnyRole(["Administrador"]);
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "confirm" | "approved" | "rejected" | "requested" | "cancelled">(
    "idle"
  );
  const [storedPayload, setStoredPayload] = useState<any>(null);

  const emailAprovadores = [
    "giovanna.silva@caixavidaeprevidencia.com.br",
    "caroline.batista@caixavidaeprevidencia.com.br",
  ];
  // const emailAprovadores = ["carlos.dias@unitybrindes.com.br", "fernando.reimberg@unitybrindes.com.br"];

  const emailAprovadoresUnity = ["ti@unitybrindes.com.br"];
  const [cancelReason, setCancelReason] = useState("");
  const [freteValido, setFreteValido] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [cadastrandoPedido, setCadastrandoPedido] = useState(false);
  const [cadastroError, setCadastroError] = useState<string | null>(null);

  //aguarda o valor do frete ser calculado
  useEffect(() => {
    const id = setInterval(() => {
      try {
        setFreteValido(true);
      } catch {
        setFreteValido(false);
      }
    }, 500);
    return () => clearInterval(id);
  }, []);

  // Pega o endereço de entrega do storage para consultar o frete no resumo
  const delivery = useMemo(() => {
    if (!storedPayload) {
      return { stateCode: "", city: "", zipCode: "" };
    }
    const zipDigits = (storedPayload.zipCodeShipping || "").replace(/\D/g, "");
    return {
      stateCode: (storedPayload.addressStateCodeShipping || "").toUpperCase(),
      city: storedPayload.addressCityShipping || "",
      zipCode: zipDigits,
    };
  }, [storedPayload]);

  // Pega o valor do frete do cookie
  const frete = Number(Cookies.get("valorFrete") || "0") || 0;

  // Busca os dados do temp-storage
  const fetchPayloadFromStorage = useCallback(async () => {
    try {
      const jti = await getJti();
      if (!jti) {
        throw new Error("Não foi possível obter o JTI do token");
      }

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
        throw new Error("Falha ao buscar dados do temp-storage");
      }

      const data = await response.json();
      if (!data.success || !data.data?.success) {
        throw new Error(data.data?.message || "Erro ao buscar dados do temp-storage");
      }

      setStoredPayload(data.data.result.content);
    } catch (error) {
      console.error("[SolicitarAprovacao] Erro ao buscar payload do storage:", error);
      setStoredPayload(null);
    }
  }, [getJti]);

  useEffect(() => {
    fetchPayloadFromStorage();
  }, [fetchPayloadFromStorage]);

  // Monta o payload usando os dados do storage, atualizando apenas produtos do carrinho
  const payload: any = useMemo(() => {
    // Se não há dados do storage, retorna null (aguarda carregamento)
    if (!storedPayload) {
      return null;
    }

    // Atualiza os produtos do carrinho (podem ter mudado)
    const updatedProducts = cart.map((product) => ({
      chavePro: product.chavePro,
      codPro: product.codPro,
      descrPro: product.productName,
      descrProCor: product.color,
      descrProTam: product.size || "",
      quantityPro: product.quantity,
      unitPriceTablePro: product.unitPriceBase,
      unitPricePro: product.unitPriceEffective,
      totalServiceAmount:
        product.personalizations?.reduce(
          (total, personalization) => total + personalization.precoUnitario * product.quantity,
          0
        ) || 0,
      totalProductAmount: product.subtotal,
      personals: product.personalizations?.map((personalization) => ({
        chavePersonal: personalization.chavePersonal,
        descrWebPersonal: personalization.descricao,
        quantityPersonal: product.quantity,
        unitPricePersonal: Number(personalization.precoUnitario).toFixed(2),
        totalPersonalAmount: personalization.precoUnitario * product.quantity,
      })),
    }));

    // Recalcula totais baseado nos produtos atualizados
    const newTotalValue = updatedProducts.reduce((sum, p) => sum + (p.totalProductAmount || 0), 0);
    const newFrete = frete || Number(storedPayload.totalShippingAmount || "0") || 0;

    // Retorna o payload do storage com produtos e totais atualizados
    return {
      ...storedPayload,
      products: updatedProducts,
      totalProductsAmount: newTotalValue.toFixed(2),
      totalShippingAmount: newFrete.toFixed(2),
      orderTotalAmount: (newTotalValue + newFrete).toFixed(2),
      orderStatus: isAdmin ? "Aprovado" : "Aguardando aprovação",
    };
  }, [storedPayload, cart, frete, isAdmin]);

  // -------- Função para cadastrar pedido na API --------
  const fetchCadastroPedido = useCallback(
    async (orderId: string, signal?: AbortSignal) => {
      if (!payload || !orderId) {
        throw new Error("Dados do pedido ou número do pedido não encontrados");
      }

      try {
        const res = await fetch("/api/send-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reqMethod: "POST",
            reqEndpoint: `/order/${orderId}`,
            reqHeaders: {
              "X-Environment": "HOMOLOGACAO",
              ...payload,
            },
          }),
          signal,
        });

        const result = await res.json();

        console.log("result", result);
        if (!res.ok) {
          throw new Error(result?.message || "Erro ao cadastrar pedido na base de dados");
        }
        if (!result?.data?.success) {
          throw new Error(result?.data?.message || "Erro ao cadastrar pedido na base de dados");
        }

        return result;
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          throw new Error("Operação cancelada");
        }
        throw err;
      }
    },
    [payload]
  );

  // -------- Ações --------
  const handleAproved = async () => {
    setStatus("approved");
    setCadastrandoPedido(true);
    setCadastroError(null);

    try {
      // Busca o número do pedido e aguarda o resultado diretamente
      const currentOrderId = await fetchOrderNumber();
      if (!currentOrderId) {
        throw new Error("Não foi possível obter o número do pedido");
      }

      // Cadastra o pedido na API usando o número obtido diretamente
      await fetchCadastroPedido(currentOrderId);

      // Usa o número do pedido obtido (já está salvo no cookie)
      const orderIdForEmail = currentOrderId;

      // Garante que o orderNumber está no cookie antes de limpar o carrinho
      // O fetchOrderNumber já salvou no cookie, mas garantimos aqui também
      Cookies.set("orderNumber", currentOrderId, {
        expires: 7,
        sameSite: "Lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      });

      // Limpa o carrinho ANTES de redirecionar (mas após garantir o cookie)
      clearCart();

      // Aguarda um pequeno delay para garantir que o carrinho foi limpo
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Se chegou aqui, tudo deu certo - redireciona
      router.replace("/pedido");

      // Envia email de pedido aprovado em background (não bloqueia o redirecionamento)
      // Se falhar, apenas loga o erro, mas o pedido já foi cadastrado
      //giovanna.silva@caixavidaeprevidencia.com.br
      //caroline.batista@caixavidaeprevidencia.com.br
      fetch("/api/send-mail-aproved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload,
          products: cart,
          orderNumber: orderIdForEmail,
          emailConfig: {
            to: [payload.email || payload.emailShipping].filter(Boolean),
            cc: [],
            cco: ["carlos.dias@unitybrindes.com.br", "fernando.reimberg@unitybrindes.com.br"],
            replyTo: "ti@unitybrindes.com.br",
          },
        }),
      })
        .then(async (emailResponse) => {
          const emailResult = await emailResponse.json();
          if (!emailResponse.ok || !emailResult.success) {
            console.error("Erro ao enviar e-mail de pedido aprovado:", emailResult.message);
          }
        })
        .catch((err) => {
          console.error("Erro ao enviar e-mail de pedido aprovado:", err);
          // Não bloqueia o fluxo, apenas loga o erro
        });
    } catch (err: unknown) {
      console.error("Erro ao finalizar pedido:", err);
      setCadastroError(
        err instanceof Error
          ? err.message
          : "Não foi possível cadastrar o pedido. Por favor, tente novamente ou entre em contato com o suporte."
      );
      setStatus("idle"); // Volta ao estado inicial em caso de erro
    } finally {
      setCadastrandoPedido(false);
    }
  };
  const handleRequested = async () => {
    setStatus("requested");
    setCadastrandoPedido(true);
    setCadastroError(null);
    setSendingEmail(true);
    setEmailError(null);

    try {
      // Busca o número do pedido e aguarda o resultado diretamente
      const currentOrderId = await fetchOrderNumber();
      if (!currentOrderId) {
        throw new Error("Não foi possível obter o número do pedido");
      }

      // SEMPRE cadastra o pedido primeiro (isso é o mais importante)
      await fetchCadastroPedido(currentOrderId);

      // Usa o número do pedido obtido (já está salvo no cookie)
      const orderIdForEmail = currentOrderId;

      // Garante que o orderNumber está no cookie antes de limpar o carrinho
      // O fetchOrderNumber já salvou no cookie, mas garantimos aqui também
      Cookies.set("orderNumber", currentOrderId, {
        expires: 7,
        sameSite: "Lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      });

      // O envio de email pode acontecer em background, mas não bloqueia o redirecionamento
      router.replace("/pedido");

      // Tenta enviar email em background (não bloqueia o redirecionamento)
      // Se falhar, apenas loga o erro, mas o pedido já foi cadastrado
      const emailTo = payload.email || payload.emailShipping;
      let ccMail: string[] = [];
      if (emailTo === "ti@unitybrindes.com.br") {
        ccMail = [...emailAprovadoresUnity];
      } else {
        ccMail = [...emailAprovadores];
      }
      fetch("/api/send-mail-aproves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload,
          products: cart,
          orderNumber: orderIdForEmail,
          emailConfig: {
            to: emailTo,
            cc: ccMail,
            cco: ["carlos.dias@unitybrindes.com.br", "fernando.reimberg@unitybrindes.com.br"],
            replyTo: "ti@unitybrindes.com.br",
          },
        }),
      })
        .then(async (emailResponse) => {
          const emailResult = await emailResponse.json();
          if (!emailResponse.ok || !emailResult.success) {
            console.error("Erro ao enviar e-mail de aprovação:", emailResult.message);
          }
        })
        .catch((err) => {
          console.error("Erro ao enviar e-mail de aprovação:", err);
          // Não bloqueia o fluxo, apenas loga o erro
        });
    } catch (err: unknown) {
      console.error("Erro ao cadastrar pedido:", err);
      setCadastroError(
        err instanceof Error
          ? err.message
          : "Não foi possível cadastrar o pedido. Por favor, tente novamente ou entre em contato com o suporte."
      );
      setStatus("idle"); // Volta ao estado inicial em caso de erro
    } finally {
      setCadastrandoPedido(false);
      setSendingEmail(false);
    }
  };
  const handleCancelConfirm = () => {
    clearCart();
    router.push("/");
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex md:flex-row flex-col gap-4 flex-1 h-full p-4 space-y-4">
        <div className="rounded-lg border border-gray-200 p-4 flex flex-col justify-center items-center gap-3 w-full h-fit md:w-1/2 shadow-lg ">
          {isAdmin ? (
            <>
              <div className="w-full h-full flex justify-center items-center flex-col  gap-8">
                <div className="w-full h-full flex justify-center items-center flex-col  gap-6">
                  <div className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 border border-green-200">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-600">
                      <Check size={14} className="text-white" />
                    </span>
                    <span className="text-xs text-green-700 font-medium">Pronto para finalizar</span>
                  </div>

                  <h1 className="text-gray-800 text-center text-base md:text-lg max-w-[460px] px-6 leading-relaxed">
                    Obrigado por sua compra! Revise os detalhes do seu pedido e clique para finalizar sua solicitação.
                  </h1>
                </div>

                <div className="flex flex-col justify-center gap-4">
                  <button
                    onClick={handleAproved}
                    disabled={!freteValido || cadastrandoPedido}
                    className={`w-full px-4 py-2 rounded-md text-white text-sm ${
                      !freteValido || cadastrandoPedido
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-500 cursor-pointer"
                    }`}
                  >
                    {cadastrandoPedido
                      ? "Cadastrando pedido..."
                      : freteValido
                      ? "Finalizar Compra"
                      : "Aguardando cálculo do frete..."}
                  </button>

                  {cadastroError && (
                    <div className="rounded-md border border-red-300 bg-red-50 p-3 text-red-800 text-sm">
                      <p className="font-medium mb-1">Erro ao cadastrar pedido:</p>
                      <p>{cadastroError}</p>
                      <button
                        onClick={() => {
                          setCadastroError(null);
                          setStatus("idle");
                        }}
                        className="mt-2 text-xs underline hover:no-underline"
                      >
                        Tentar novamente
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setStatus("rejected")}
                    className="w-full px-4 py-2 rounded-md bg-gray-400 text-white hover:bg-orange-500 text-sm cursor-pointer"
                  >
                    Cancelar Compra
                  </button>

                  {status === "rejected" && (
                    <div className="w-full mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                      <h3 className="font-medium text-red-800 mb-2">Confirmar cancelamento do pedido</h3>
                      <p className="text-sm text-red-700 mb-3">Tem certeza que deseja cancelar este pedido?</p>
                      <label className="text-sm text-red-900 mb-1 block">Motivo (opcional)</label>
                      <textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        rows={4}
                        className="w-full rounded-md border border-red-200 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                        placeholder="Descreva o motivo do cancelamento (opcional)"
                      />
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={handleCancelConfirm}
                          className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-500 text-sm"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setStatus("idle")}
                          className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 text-sm"
                        >
                          Voltar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 border border-blue-200 mb-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                  <Check size={14} className="text-white" />
                </span>
                <span className="text-xs text-blue-700 font-medium">Aprovação necessária</span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleRequested}
                  disabled={sendingEmail || cadastrandoPedido || cart.length === 0}
                  className={`px-4 py-2 rounded-md text-white text-sm ${
                    sendingEmail || cadastrandoPedido || cart.length === 0
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-500 cursor-pointer"
                  }`}
                >
                  {cadastrandoPedido
                    ? "Cadastrando pedido..."
                    : sendingEmail
                    ? "Enviando e-mail..."
                    : "Solicitar Aprovação"}
                </button>
              </div>

              {emailError && (
                <div className="rounded-md border border-red-300 bg-red-50 p-3 text-red-800 text-sm mt-2">
                  <p className="font-medium mb-1">Erro ao enviar e-mail:</p>
                  <p>{emailError}</p>
                  <button
                    onClick={() => {
                      setEmailError(null);
                      setStatus("idle");
                    }}
                    className="mt-2 text-xs underline hover:no-underline"
                  >
                    Tentar novamente
                  </button>
                </div>
              )}

              {cadastroError && (
                <div className="rounded-md border border-orange-300 bg-orange-50 p-3 text-orange-800 text-sm mt-2">
                  <p className="font-medium mb-1">Aviso sobre o cadastro do pedido:</p>
                  <p>{cadastroError}</p>
                  <button
                    onClick={() => {
                      setCadastroError(null);
                      setStatus("idle");
                    }}
                    className="mt-2 text-xs underline hover:no-underline"
                  >
                    Fechar
                  </button>
                </div>
              )}

              {status === "requested" && !emailError && (
                <div className="rounded-md border border-blue-300 bg-blue-50 p-3 text-blue-800 text-sm mt-2">
                  Obrigado por sua compra! Seu pedido está em processo de aprovação. Assim que tudo estiver pronto, você
                  receberá uma mensagem com o status do seu pedido.
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col flex-1 w-full lg:w-1/2">
          <div className="rounded-lg border border-gray-200 shadow-lg p-4">
            <Resumo delivery={delivery} />
          </div>
        </div>
      </div>
    </div>
  );
}
