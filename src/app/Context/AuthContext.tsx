"use client";

import { useRouter } from "next/navigation";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { AuthContextType, UsuarioContext } from "../types/responseTypes";
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

  // Hidrata o orderNumber do cookie ao montar
  useEffect(() => {
    try {
      const storedOrder = Cookies.get("orderNumber");
      if (storedOrder) {
        setOrderNumber(storedOrder);
      }
    } catch {
      // ignore
    }
  }, []);

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

      // Após login bem-sucedido, buscar dados completos
      await fetchUserData();
      router.push("/");

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

  const fetchOrderNumber = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      // Sempre buscar o id do usuário a partir do cookie 'cliente'
      let userIdFromCookie: string | undefined;
      try {
        const raw = Cookies.get("cliente");
        if (raw) {
          const parsed = JSON.parse(raw);
          userIdFromCookie = (parsed?.id ?? parsed?.userId)?.toString();
        }
      } catch (e) {
        console.warn("[AuthContext] Falha ao ler cookie 'cliente' para userId", e);
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
            storeId: "32",
            userId: userIdFromCookie || "",
          },
        }),
        signal,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Erro ao buscar produtos");
      }
      // Extrai o número do pedido como string para evitar salvar "[object Object]"
      const orderPayload = result?.data?.result;
      let orderNumberStr: string | null = null;
      if (typeof orderPayload === "string" || typeof orderPayload === "number") {
        orderNumberStr = String(orderPayload);
      } else if (orderPayload && typeof orderPayload === "object") {
        // Prioriza a chave 'orderId' e outras variantes comuns
        orderNumberStr = orderPayload.orderId || orderPayload.orderNumber || orderPayload.numero || orderPayload.id || orderPayload.pedido || orderPayload.code || null;
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
      try {
        Cookies.set("orderNumber", orderNumberStr, { expires: 7, sameSite: "Lax" });
      } catch { }

    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      console.error("error ao requisitar numero de pedido para api externa", error);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        cliente,
        roles,
        hasRole,
        hasAnyRole,
        fetchUserData,
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
