import { NextRequest, NextResponse } from "next/server";
import { API_REQ_APPLICATION, STORE_ID, ENVIRONMENT, JWT_REFRESH_SECRET, JWT_SECRET } from "../../../utils/env";
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

    const token = await getDecryptedToken(API_REQ_APPLICATION);
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
      return NextResponse.json({ success: false, details: data }, { status: response.status });
    }

    const result = data.result;

    // Extrai roles como array de strings (nome) para o middleware
    // Tenta extrair de result.role, result.roles, result.rules
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
    // if (process.env.NODE_ENV !== "production") {
    //   console.log("[LOGIN] rolesFromApi:", rolesFromApi);
    // }

    // Token leve para o middleware (não criptografado)
    const secret = new TextEncoder().encode(JWT_SECRET);
    const accessToken = await new SignJWT({ sub: user.id, iss: "unitybrindes", role: rolesFromApi })
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

    return res;
  } catch (err) {
    console.error("Erro ao fazer login:", err);
    return NextResponse.json({ success: false, message: "Erro interno ao fazer login" }, { status: 500 });
  }
}
