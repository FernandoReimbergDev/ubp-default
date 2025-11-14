/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { STORE_ID, ENVIRONMENT, JWT_REFRESH_SECRET, JWT_SECRET } from "../../../utils/env";
import { getDecryptedToken } from "../../../services/getDecryptedToken";
import { encrypt } from "../../../services/cryptoCookie";
import { SignJWT } from "jose";

export async function POST(req: NextRequest) {
  try {
    const storeId = STORE_ID;
    const { userName, password } = await req.json();

    if (!storeId || !userName || !password) {
      return NextResponse.json({ success: false, message: "Credenciais ou StoreID ausentes" }, { status: 400 });
    }

    const token = await getDecryptedToken();
    if (!token) {
      return NextResponse.json({ success: false, message: "Token de autenticação não encontrado" }, { status: 500 });
    }

    const response = await fetch("https://unitybrindes.com.br/authenticate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Environment": ENVIRONMENT,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ storeId: Number(storeId), username: userName, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      const msg = typeof (data as any)?.message === "string" ? ((data as any).message as string).toLowerCase() : "";
      if ((response.status === 403 || response.status === 401) && (msg.includes("origin") || msg.includes("origem"))) {
        return NextResponse.json(
          { success: false, message: "Login recusado para esta origem. Acesse pelo endereço autorizado da loja." },
          { status: 403 }
        );
      }
      return NextResponse.json({ success: false, details: data }, { status: response.status });
    }

    const result = data.result;

    const rawRoles: unknown = (result as any)?.role ?? (result as any)?.roles ?? (result as any)?.rules ?? [];
    const rolesFromApi: string[] = Array.isArray(rawRoles)
      ? rawRoles
          .map((r: unknown) => {
            if (typeof r === "string") return r;
            if (r && typeof r === "object" && "name" in (r as any) && typeof (r as any).name === "string") {
              return (r as any).name as string;
            }
            return undefined;
          })
          .filter((v: unknown): v is string => typeof v === "string")
      : [];

    const user = {
      id: result.id,
      firstName: result.firstName || result.name || "Usuário",
      role: rolesFromApi,
    };
    // Token leve para o middleware (não criptografado)
    const secret = new TextEncoder().encode(JWT_SECRET);
    const accessToken = await new SignJWT({
      sub: user.id,
      iss: "unitybrindes",
      role: rolesFromApi,
      jti: crypto.randomUUID(),
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime("15m")
      .sign(secret);

    // Token completo criptografado (para rotas internas da API)
    const refreshSecret = new TextEncoder().encode(JWT_REFRESH_SECRET);
    const refreshToken = await new SignJWT(user)
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(refreshSecret);
    const encryptedRefreshToken = encrypt(refreshToken);

    // Troca para garantir que cookies sejam setados corretamente
    const res = new NextResponse(JSON.stringify({ success: true, user }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

    res.cookies.set("auth", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 15,
      sameSite: "lax",
    });

    res.cookies.set("refreshToken", encryptedRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    // Remove cookie orderNumber antigo ao fazer login (sempre gerar novo)
    res.cookies.set("orderNumber", "", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(0),
      sameSite: "lax",
    });

    return res;
  } catch (err: unknown) {
    console.error("Erro ao fazer login:", err);
    return NextResponse.json({ success: false, message: "Erro interno ao fazer login" }, { status: 500 });
  }
}
