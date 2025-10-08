"use client";

import { useRouter } from "next/navigation";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { AuthContextType, UsuarioContext } from "../types/responseTypes";
import Cookies from "js-cookie";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [step, setStep] = useState<"username" | "signIn" | "code" | "password" | "resetPassword">("username");
  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [code, setCode] = useState("");
  const [cliente, setCliente] = useState<UsuarioContext | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [roles, setRoles] = useState<string[]>([]);

  const hasRole = (role: string) => roles.includes(role.toLowerCase());
  const hasAnyRole = (requiredRoles: string[]) => requiredRoles.some((role) => hasRole(role));

  const fetchUserData = async () => {
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
      setRoles(userRoles);
      Cookies.set("cliente", JSON.stringify(user), { expires: 7 });

      return true;
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error);
      setCliente(null);
      setRoles([]);
      Cookies.remove("cliente");
      return false;
    }
  };
  // Reidrata sessão ao carregar
  useEffect(() => {
    const stored = Cookies.get("cliente");
    if (stored) {
      try {
        setCliente(JSON.parse(stored));
      } catch {
        Cookies.remove("cliente");
        setLoading(false);
        return;
      }

      // Busca dados frescos em background
      fetchUserData().finally(() => setLoading(false));
    }
    setLoading(false);
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
          email: data.email, // garantir que está aqui
        };
      }

      setUserName(userName);
      setEmail(data.email);
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

  const verifyCode = async (email: string, accessCode: string) => {
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, accessCode }),
      });
      const data = await res.json();
      setCode(accessCode);
      setStep("resetPassword");
      return { success: res.ok, message: data.message };
    } catch {
      return { success: false, message: "Erro interno ao verificar código" };
    }
  };

  const setPassword = async (email: string, accessCode: string, password: string, confirmPassword: string) => {
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, accessCode, password, confirmPassword }),
      });

      const data = await res.json();
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
      setCliente(null);
      setRoles([]);
      setUserName("");
      setStep("username");
      router.push("/sign-in");
    }
  };

  const requestCodePassword = async (email: string) => {
    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setStep("resetPassword");
      return {
        success: res.ok,
        message: data.message,
        result: data.result,
      };
    } catch {
      return {
        success: false,
        message: "Erro interno ao solicitar código de recuperação.",
      };
    }
  };

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
        setCliente,
        loading,
        signIn,
        signOut,
        requestAccess,
        verifyCode,
        setPassword,
        requestCodePassword,
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
