"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRouter } from "next/navigation";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { AuthContextType, UsuarioContext, UsuarioResponse } from "../types/responseTypes";
import Cookies from "js-cookie";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [step, setStep] = useState<"username" | "signIn" | "code" | "password" | "resetPassword">("username");
  const [email, setEmail] = useState("");
  const [firstAccess, setFirstAccess] = useState(false);
  const [userName, setUserName] = useState("");
  const [code, setCode] = useState("");
  const [cliente, setCliente] = useState<UsuarioContext | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [roles, setRoles] = useState<string[]>([]);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const hasRole = (role: string) => roles.includes(role.toLowerCase());
  const hasAnyRole = (requiredRoles: string[]) => requiredRoles.some((role) => hasRole(role));

  const fetchUserData = useCallback(async (retryCount = 0) => {
    try {
      const res = await fetch("/api/me", {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        // Token inválido ou expirado
        setCliente(null);
        setRoles([]);
        Cookies.remove("cliente");
        return false;
      }

      const { user, roles: userRoles } = await res.json();
      setCliente(user);
      setRoles(userRoles || []); // Garantir que roles seja sempre array
      Cookies.set("cliente", JSON.stringify(user), { expires: 7 });
      return true;
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error);

      // Retry em caso de erro de rede (máximo 2 tentativas)
      if (retryCount < 2 && error instanceof TypeError) {
        console.log(`Tentativa ${retryCount + 1} de 3 para buscar dados do usuário`);
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Aguarda 1 segundo
        return fetchUserData(retryCount + 1);
      }

      // Se esgotou tentativas ou é erro diferente, limpa dados
      setCliente(null);
      setRoles([]);
      Cookies.remove("cliente");
      return false;
    }
  }, []);

  useEffect(() => {
    const stored = Cookies.get("cliente");
    if (stored) {
      try {
        const parsedCliente = JSON.parse(stored);
        setCliente(parsedCliente);

        // Busca dados frescos em background, mas não zera roles se falhar
        fetchUserData().finally(() => setLoading(false));
      } catch {
        Cookies.remove("cliente");
        setLoading(false);
        return;
      }
    } else {
      // Se não há cliente armazenado, busca dados do servidor
      fetchUserData().finally(() => setLoading(false));
    }
  }, [fetchUserData]);

  const requestAccess = async (userName: string) => {
    try {
      const res = await fetch("/api/auth/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName }),
      });

      const data = await res.json();
      if (!data.success) {
        return {
          success: false,
          status: data.status,
          message: data.message || "Falha ao requisitar acesso",
          email: data.email,
        };
      }

      setUserName(userName);
      setEmail(data.email);
      if (data.firstAccess === "0") {
        setFirstAccess(true);
      }
      setStep(data.status === "code-sent" ? "code" : "signIn");
      return data;
    } catch (err: unknown) {
      return {
        success: false,
        message: "Erro interno ao requisitar acesso",
        err,
      };
    }
  };

  const verifyCode = async (userName: string, accessCode: string) => {
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: userName, accessCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.message };
      }
      const validated = data?.success === true || data?.status === "awaiting-password";
      if (validated) {
        setCode(accessCode);
        if (firstAccess) {
          setStep("password");
        } else {
          setStep("resetPassword");
        }
      }
      return { success: validated, message: data.message };
    } catch {
      return { success: false, message: "Erro interno ao verificar código" };
    }
  };

  const setNewPassword = async (password: string, confirmPassword: string) => {
    if (!code) {
      return { success: false, message: "Código de recuperação ausente. Volte e valide o código novamente." };
    }
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName: userName, accessCode: code, password, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.message };
      }
      return { success: res.ok, message: data.message };
    } catch {
      return {
        success: false,
        message: "Erro interno ao cadastrar senha",
      };
    }
  };

  const setPassword = async (password: string, confirmPassword: string) => {
    try {
      const res = await fetch("/api/auth/new-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName: userName, accessCode: code, password, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.message };
      }
      return { success: res.ok, message: data.message };
    } catch {
      return {
        success: false,
        message: "Erro interno ao cadastrar senha",
      };
    }
  };

  const signIn = async ({ userName, password }: { userName: string; password: string }) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userName, password }),
      });

      if (!res.ok) {
        setCliente(null);
        setRoles([]);
        Cookies.remove("cliente");
        return false;
      }

      // Remove cookie orderNumber antigo ao fazer login (sempre gerar novo)
      Cookies.remove("orderNumber");
      setOrderNumber(null);

      // Após login bem-sucedido, buscar dados completos
      await fetchUserData();
      router.push("/");

      //payload deafault vazio
      const payload = {
        storeId: "32",
        userId: cliente?.id,
        entityType: "",
        legalName: "",
        cpfCnpj: "",
        ie: "",
        email: "",
        areaCode: "",
        phone: "",

        // Endereço de faturamento (fixo)
        entityTypeBilling: "PJ",
        legalNameBilling: "Caixa Vida e Previdencia S/A",
        contactNameBilling: "",
        cpfCnpjBilling: "03730204000176",
        ieBilling: "",
        emailBilling: "",
        areaCodeBilling: "",
        phoneBilling: "",
        addressIbgeCodeBilling: "",
        zipCodeBilling: "04583110",
        streetNameBilling: "Av. Doutor Chucri Zaidan",
        streetNumberBilling: "246",
        addressLine2Billing: "12º andar",
        addressNeighborhoodBilling: "Vila Cordeiro",
        addressCityBilling: "São Paulo",
        addressStateCodeBilling: "SP",

        // Endereço de entrega (do formulário)
        entityTypeShipping: "",
        legalNameShipping: "",
        contactNameShipping: "",
        cpfCnpjShipping: "",
        ieShipping: "",
        emailShipping: "",
        areaCodeShipping: "",
        phoneShipping: "",
        addressIbgeCodeShipping: "",
        zipCodeShipping: "",
        streetNameShipping: "",
        streetNumberShipping: "",
        addressLine2Shipping: "",
        addressNeighborhoodShipping: "",
        addressCityShipping: "",
        addressStateCodeShipping: "",

        // Produtos do carrinho
        products: [
          {
            chavePro: "",
            codPro: "",
            descrPro: "",
            descrProCor: "",
            descrProTam: "",
            quantityPro: "",
            unitPriceTablePro: "",
            unitPricePro: "",
            totalServiceAmount: "",
            totalProductAmount: "",
            personals: [],
          },
        ],

        // Informações de pagamento e valores
        paymentMethod: "Boleto",
        numberOfInstallments: "1",
        totalProductsAmount: "",
        totalDiscountAmount: "0.00",
        totalShippingAmount: "",
        totalInterestAmount: "0.00",
        orderTotalAmount: "",
        totalTaxAmount: "0",
        paymentStatus: "PENDENTE",
        orderStatus: "Aguardando aprovação",
        expectedDeliveryDate: "",
        deliveryDate: "",
        paymentDate: "",
      };
      //Após login bem-sucedido, criar o payload do temp-storage
      await fetchPayloadStorage(payload, "POST");
      return true;
    } catch (err) {
      setCliente(null);
      setRoles([]);
      Cookies.remove("cliente");
      console.error("Erro ao fazer login:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      Cookies.remove("cliente");
      Cookies.remove("orderNumber");
      setOrderNumber(null);
      setCliente(null);
      setRoles([]);
      setUserName("");
      setStep("username");
      router.push("/sign-in");
    }
  };

  const requestCodePassword = async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: userName, email: email }),
        signal,
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          message: data.message,
        };
      }
      return {
        success: res.ok,
        message: data.message,
      };
    } catch {
      return {
        success: false,
        message: "Erro interno ao solicitar código de recuperação.",
      };
    }
  };

  const cleanOrderNumber = () => {
    Cookies.remove("orderNumber");
    setOrderNumber(null);
  };

  const getUserIdFromCookie = () => {
    let userIdFromCookie: string | undefined;
    try {
      const raw = Cookies.get("cliente");
      if (raw) {
        const parsed = JSON.parse(raw);
        userIdFromCookie = (parsed?.id ?? parsed?.userId)?.toString();
      }
      return userIdFromCookie;
    } catch (e) {
      console.warn("[AuthContext] Falha ao ler cookie 'cliente' para userId", e);
    }
  };

  const getJti = useCallback(async (): Promise<string | undefined> => {
    try {
      const res = await fetch("/api/jti", {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        console.warn("[AuthContext] Falha ao obter JTI do token:", data?.message || "Erro desconhecido");
        return undefined;
      }

      if (!data?.success) {
        console.warn("[AuthContext] JTI não retornado com sucesso:", data?.message || "Erro desconhecido");
        return undefined;
      }

      if (!data?.jti) {
        console.warn("[AuthContext] JTI não encontrado na resposta");
        return undefined;
      }

      return data.jti;
    } catch (error) {
      console.error("[AuthContext] Erro ao buscar JTI:", error);
      return undefined;
    }
  }, []);

  const normatizeOrderNumber = (orderNumber: string) => {
    // Extrai o número do pedido como string para evitar salvar "[object Object]"
    const orderPayload = orderNumber;
    let orderNumberStr: string | null = null;
    if (typeof orderPayload === "string" || typeof orderPayload === "number") {
      orderNumberStr = String(orderPayload);
    } else if (orderPayload && typeof orderPayload === "object") {
      // Prioriza a chave 'orderId' e outras variantes comuns
      orderNumberStr = orderPayload || null;
      if (typeof orderNumberStr !== "string") orderNumberStr = null;
    }

    if (!orderNumberStr) {
      console.warn("[AuthContext] Não foi possível derivar um número de pedido legível do payload:", orderPayload);
      // fallback: serializa como JSON, para não ficar [object Object]
      try {
        orderNumberStr = JSON.stringify(orderPayload);
      } catch {
        orderNumberStr = "";
      }
    }

    setOrderNumber(orderNumberStr);
  };

  const setOrderNumberInCookie = (orderNumber: string) => {
    try {
      Cookies.set("orderNumber", orderNumber, {
        expires: 7,
        sameSite: "Lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      });
    } catch {}
  };

  const fetchUserDetails = useCallback(async (signal?: AbortSignal): Promise<UsuarioResponse | undefined> => {
    const userIdFromCookie = getUserIdFromCookie();

    if (!userIdFromCookie) {
      console.warn("[AuthContext] userId não encontrado, não é possível buscar dados do usuário");
      return undefined;
    }

    try {
      const response = await fetch("/api/send-request", {
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Falha ao buscar dados do usuário na API externa");
      }

      if (!data?.data?.success) {
        throw new Error(data?.data?.message || "Erro ao buscar dados do usuário");
      }

      const result = data?.data?.result;
      if (!result || !Array.isArray(result) || result.length === 0) {
        throw new Error("Nenhum dado de usuário encontrado");
      }

      return { success: true, message: "", result };
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return undefined;
      }
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao buscar dados do usuário";
      console.error("[AuthContext] Erro ao buscar dados do usuário:", errorMessage);
      return undefined;
    }
  }, []);

  const fetchOrderNumber = useCallback(async (signal?: AbortSignal): Promise<string | null> => {
    setLoading(true);
    try {
      cleanOrderNumber();

      const userIdFromCookie = getUserIdFromCookie();

      if (!userIdFromCookie) {
        throw new Error("Usuário não encontrado");
      }

      const res = await fetch("/api/send-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reqMethod: "POST",
          reqEndpoint: "/order",
          reqHeaders: {
            "X-Environment": "HOMOLOGACAO",
            userId: userIdFromCookie,
          },
        }),
        signal,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Erro ao buscar orderNumber");
      }
      if (!result?.data?.success) {
        throw new Error(result?.data?.message || "Erro ao solicitar um novo orderNumber");
      }

      // Extrai o número do pedido diretamente da resposta
      const orderId = result?.data?.result?.orderId;
      if (!orderId) {
        throw new Error("Número do pedido não retornado pela API");
      }

      // Normaliza e converte para string
      let orderNumberStr: string | null = null;
      if (typeof orderId === "string" || typeof orderId === "number") {
        orderNumberStr = String(orderId);
      } else if (orderId && typeof orderId === "object") {
        // Tenta extrair orderId do objeto
        orderNumberStr = (orderId as any).orderId || String(orderId);
      }

      if (!orderNumberStr) {
        throw new Error("Não foi possível derivar o número do pedido");
      }

      // Atualiza estado e cookie com o número obtido
      normatizeOrderNumber(orderNumberStr);
      setOrderNumberInCookie(orderNumberStr);

      return orderNumberStr;
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return null;
      }
      console.error("error ao requisitar numero de pedido para api externa", error);
      throw error; // Re-lança o erro para que o chamador possa tratá-lo
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPayloadStorage = useCallback(
    async (payload: unknown, method: string) => {
      const jti = await getJti();
      if (!jti) {
        throw new Error("Não foi possível obter o JTI do token");
      }
      const response = await fetch("/api/send-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reqMethod: method,
          reqEndpoint: "/temp-storage",
          reqHeaders: {
            "X-Environment": "HOMOLOGACAO",
            storageId: jti,
            content: payload,
          },
        }),
      });
      if (!response.ok) {
        throw new Error("Falha ao salvar dados na api interna.");
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Falha ao salvar dados na api externa.");
      }
      if (!data.data.success) {
        throw new Error(data.data.message || "Falha ao salvar dados na api externa.");
      }
      return data.data.result;
    },
    [getJti]
  );

  return (
    <AuthContext.Provider
      value={{
        cliente,
        roles,
        hasRole,
        hasAnyRole,
        fetchUserData,
        fetchUserDetails,
        getJti,
        step,
        setStep,
        code,
        email,
        userName,
        orderNumber,
        setCliente,
        loading,
        signIn,
        signOut,
        requestAccess,
        verifyCode,
        setPassword,
        setNewPassword,
        requestCodePassword,
        fetchOrderNumber,
        fetchPayloadStorage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
};
