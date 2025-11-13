/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useAuth } from "@/app/Context/AuthContext";
import { useCart } from "@/app/Context/CartContext";
import { Resumo } from "@/app/components/Resumo";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Address, UserShape } from "@/app/types/payloadPedido";

export function SolicitarAprovacao() {
  const { hasAnyRole, fetchOrderNumber, orderNumber } = useAuth();
  const { cart, clearCart } = useCart();
  const isAdmin = hasAnyRole(["Administrador"]);
  const router = useRouter();
  const { fetchGetAddress } = useCart();
  const [status, setStatus] = useState<"idle" | "confirm" | "approved" | "rejected" | "requested" | "cancelled">(
    "idle"
  );
  const emailAprovadores = [
    "giovanna.silva@caixavidaeprevidencia.com.br",
    "caroline.batista@caixavidaeprevidencia.com.br",
  ];
  const emailAprovadoresUnity = ["ti@unitybrindes.com.br"];
  const [cancelReason, setCancelReason] = useState("");
  const [user, setUser] = useState<UserShape | null>(null);
  const [freteValido, setFreteValido] = useState(false);
  const [addressShipping, setAddressShipping] = useState<Address | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [cadastrandoPedido, setCadastrandoPedido] = useState(false);
  const [cadastroError, setCadastroError] = useState<string | null>(null);

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

  // -------- Helpers de cookie --------
  const getClienteCookie = useCallback((): any | null => {
    try {
      const raw = Cookies.get("cliente");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  const getUserIdFromCookie = useCallback((): string => {
    const parsed = getClienteCookie();
    const id = parsed?.id ?? parsed?.userId;
    return id ? String(id) : "";
  }, [getClienteCookie]);

  useEffect(() => {
    fetchGetAddress(Number(getUserIdFromCookie()));
  }, [fetchGetAddress, getUserIdFromCookie]);

  const fetchUser = useCallback(
    async (signal?: AbortSignal) => {
      const userIdFromCookie = getUserIdFromCookie();
      if (!userIdFromCookie) return;

      try {
        const res = await fetch("/api/send-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reqMethod: "GET",
            reqEndpoint: "/list-users",
            reqHeaders: {
              "X-Environment": "HOMOLOGACAO",
              userIsActive: "1",
              userIsDeleted: "0",
              userId: userIdFromCookie,
            },
          }),
          signal,
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result?.message || "Erro ao buscar dados do usuário");
        setUser(result?.data?.result?.[0]);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("Erro ao requisitar dados do usuário para API externa:", err);
      }
    },
    [getUserIdFromCookie]
  );

  const fetchShippingTemp = useCallback(
    async (signal?: AbortSignal) => {
      const userIdFromCookie = getUserIdFromCookie();
      if (!userIdFromCookie) return;
      try {
        const res = await fetch("/api/send-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reqMethod: "GET",
            reqEndpoint: "/temp-address-shipping",
            reqHeaders: {
              "X-Environment": "HOMOLOGACAO",
              userId: userIdFromCookie,
            },
          }),
          signal,
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result?.message || "Erro ao buscar dados de entrega temp");
        setAddressShipping(result?.data?.result);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("Erro ao requisitar dados de entrega temp para API externa:", err);
      }
    },
    [getUserIdFromCookie]
  );

  useEffect(() => {
    const ac = new AbortController();
    fetchUser(ac.signal);
    fetchShippingTemp(ac.signal);
    return () => ac.abort();
  }, [fetchUser, fetchShippingTemp]);

  // -------- Totais do carrinho --------
  // Os preços já estão recalculados no carrinho quando a quantidade muda
  // Basta somar os subtotais de cada item
  const totalValue = useMemo(() => {
    return cart.reduce((total, product) => {
      return total + (product.subtotal || 0);
    }, 0);
  }, [cart]);

  const delivery = useMemo(() => {
    const zipDigits = (addressShipping?.zipCodeShipping || "").replace(/\D/g, "");
    return {
      stateCode: (addressShipping?.addressStateCodeShipping || "").toUpperCase(),
      city: addressShipping?.addressCityShipping || "",
      zipCode: zipDigits,
    };
  }, [addressShipping]);

  const frete = Number(Cookies.get("valorFrete") || "0") || 0;
  const payload: any = useMemo(
    () => ({
      storeId: "32",
      userId: Number(getUserIdFromCookie()),
      entityType: user?.entityType || "PF",
      legalName: user?.legalName || user?.fullName || "",
      cpfCnpj: user?.cpfCnpj || addressShipping?.cpfCnpjShipping || "",
      ie: user?.ie || "",
      email: user?.email || addressShipping?.emailShipping || "",
      areaCode: user?.phone?.areaCode || addressShipping?.areaCodeShipping || "",
      phone: user?.phone?.number || addressShipping?.phoneShipping || "",

      entityTypeBilling: "PJ",
      legalNameBilling: "Caixa Vida e Previdencia S/A",
      contactNameBilling: user?.fullName || "",
      cpfCnpjBilling: "03730204000176",
      ieBilling: user?.ie || "",
      emailBilling: user?.email || addressShipping?.emailShipping || "",
      areaCodeBilling: user?.phone?.areaCode || addressShipping?.areaCodeShipping || "",
      phoneBilling: user?.phone?.number || addressShipping?.phoneShipping || "",
      addressIbgeCodeBilling: "",
      zipCodeBilling: "04583110",
      streetNameBilling: "Av. Doutor Chucri Zaidan",
      streetNumberBilling: "246",
      addressLine2Billing: "12º andar",
      addressNeighborhoodBilling: "Vila Cordeiro",
      addressCityBilling: "São Paulo",
      addressStateCodeBilling: "SP",

      entityTypeShipping: addressShipping?.entityTypeShipping || "PJ",
      legalNameShipping: addressShipping?.legalNameShipping || "",
      contactNameShipping: addressShipping?.contactNameShipping || user?.fullName || "",
      cpfCnpjShipping: addressShipping?.cpfCnpjShipping || "",
      ieShipping: addressShipping?.ieShipping || user?.ie || "",
      emailShipping: addressShipping?.emailShipping || user?.email || "",
      areaCodeShipping: addressShipping?.areaCodeShipping || user?.phone?.areaCode || "",
      phoneShipping: addressShipping?.phoneShipping || user?.phone?.number || "",
      addressIbgeCodeShipping: addressShipping?.addressIbgeCodeShipping || "",
      zipCodeShipping: addressShipping?.zipCodeShipping || "",
      streetNameShipping: addressShipping?.streetNameShipping || "",
      streetNumberShipping: addressShipping?.streetNumberShipping || "",
      addressLine2Shipping: addressShipping?.addressLine2Shipping || "",
      addressNeighborhoodShipping: addressShipping?.addressNeighborhoodShipping || "",
      addressCityShipping: addressShipping?.addressCityShipping || "",
      addressStateCodeShipping: addressShipping?.addressStateCodeShipping || "",

      products: cart.map((product) => ({
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
      })),

      paymentMethod: "Boleto",
      numberOfInstallments: "1",
      totalProductsAmount: totalValue.toFixed(2),
      totalDiscountAmount: "0.00",
      totalShippingAmount: frete.toFixed(2),
      totalInterestAmount: "0.00",
      orderTotalAmount: (totalValue + frete).toFixed(2),
      totalTaxAmount: "0",
      paymentStatus: "PENDENTE",
      orderStatus: isAdmin ? "Aprovado" : "Aguardando aprovação",
      expectedDeliveryDate: "",
      deliveryDate: "",
      paymentDate: "",
    }),
    [getUserIdFromCookie, user, addressShipping, totalValue, frete, isAdmin, cart]
  );

  // -------- Função para cadastrar pedido na API --------
  const fetchCadastroPedido = useCallback(
    async (signal?: AbortSignal) => {
      const currentOrderId = orderNumber || Cookies.get("orderNumber") || undefined;
      if (!payload || !currentOrderId) {
        throw new Error("Dados do pedido ou número do pedido não encontrados");
      }

      try {
        const res = await fetch("/api/send-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reqMethod: "POST",
            reqEndpoint: `/order/${currentOrderId}`,
            reqHeaders: {
              "X-Environment": "HOMOLOGACAO",
              ...payload,
            },
          }),
          signal,
        });

        const result = await res.json();
        if (!res.ok) {
          throw new Error(result?.message || "Erro ao cadastrar pedido na base de dados");
        }

        // Usa sempre o número do pedido que foi recebido do fetchOrderNumber
        // Não atualiza o cookie, mantém o número original
        return result;
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          throw new Error("Operação cancelada");
        }
        throw err;
      }
    },
    [payload, orderNumber]
  );

  // -------- Ações --------
  const handleAproved = async () => {
    setStatus("approved");
    setCadastrandoPedido(true);
    setCadastroError(null);

    try {
      // Salva payload no localStorage
      try {
        localStorage.setItem("pedidoPayload", JSON.stringify(payload));
      } catch {}
      try {
        Cookies.remove("pedidoPayload", { path: "/" });
      } catch {}

      // Busca o número do pedido
      await fetchOrderNumber();

      // Aguarda um pouco para garantir que o orderNumber foi atualizado
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Tenta obter o orderNumber novamente
      const currentOrderId = orderNumber || Cookies.get("orderNumber");
      if (!currentOrderId) {
        throw new Error("Não foi possível obter o número do pedido");
      }

      // Cadastra o pedido na API
      await fetchCadastroPedido();

      // Se chegou aqui, tudo deu certo - redireciona
      router.push("/pedido");

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
          orderNumber: currentOrderId,
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
      // Salva payload no localStorage primeiro
      try {
        localStorage.setItem("pedidoPayload", JSON.stringify(payload));
      } catch {}
      try {
        Cookies.remove("pedidoPayload", { path: "/" });
      } catch {}

      // Busca o número do pedido
      await fetchOrderNumber();

      // Aguarda um pouco para garantir que o orderNumber foi atualizado
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Tenta obter o orderNumber novamente
      const currentOrderId = orderNumber || Cookies.get("orderNumber");
      if (!currentOrderId) {
        throw new Error("Não foi possível obter o número do pedido");
      }

      // SEMPRE cadastra o pedido primeiro (isso é o mais importante)
      await fetchCadastroPedido();

      // Se o cadastro foi bem-sucedido, redireciona imediatamente
      // O envio de email pode acontecer em background, mas não bloqueia o redirecionamento
      router.push("/pedido");

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
          orderNumber: currentOrderId,
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
