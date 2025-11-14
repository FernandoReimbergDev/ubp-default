/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDecryptedToken } from "../../../services/getDecryptedToken";
import { ENVIRONMENT, JWT_REFRESH_SECRET, JWT_SECRET, STORE_ID } from "../../../utils/env";
import { encrypt } from "../../../services/cryptoCookie";
import { SignJWT } from "jose";

export async function POST(req: NextRequest) {
  try {
    const storeId = STORE_ID;
    const { userName, recoveryCode, password, confirmPassword } = await req.json();

    if (!storeId) {
      console.error("ID da plataforma não encontrado:", storeId);
      return NextResponse.json({ success: false, message: "Erro ao obter ID da plataforma." }, { status: 500 });
    }

    if (!recoveryCode) {
      return NextResponse.json({ success: false, message: "Código de acesso invalido." }, { status: 400 });
    }

    if (!userName || !password) {
      return NextResponse.json({ success: false, message: "Parametros inválidos." }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ success: false, message: "As senhas não coincidem." }, { status: 400 });
    }

    const token = await getDecryptedToken();
    if (!token) {
      return NextResponse.json({ success: false, message: "Erro ao obter token de autenticação." }, { status: 500 });
    }

    const url = "https://unitybrindes.com.br/password-recovery";

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Environment": ENVIRONMENT,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        storeId: Number(storeId),
        username: userName,
        password: password,
        passwordConfirm: confirmPassword,
        passwordRecoveryCode: recoveryCode,
      }),
    };

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      console.error("Erro na API externa:", data);
      return NextResponse.json({ success: false, details: data }, { status: response.status });
    }
    const result = (data as any)?.result ?? {};
    const rawRoles: unknown = result?.role ?? result?.roles ?? result?.rules ?? [];
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
      id: result?.id,
      firstName: result?.firstName || result?.name || "Usuário",
      role: rolesFromApi,
    };

    const accessSecret = new TextEncoder().encode(JWT_SECRET);
    const accessToken = await new SignJWT({
      sub: user.id,
      iss: "unitybrindes",
      role: rolesFromApi,
      jti: crypto.randomUUID(),
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime("15m")
      .sign(accessSecret);

    const refreshSecret = new TextEncoder().encode(JWT_REFRESH_SECRET);
    const refreshToken = await new SignJWT(user)
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(refreshSecret);
    const encryptedRefreshToken = encrypt(refreshToken);

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
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Erro interno ao cadastrar nova senha:", err.message);
      return NextResponse.json(
        { success: false, message: "Erro interno ao cadastrar nova senha", details: err.message },
        { status: 500 }
      );
    } else {
      console.error("Erro interno desconhecido ao cadastrar nova senha:", err);
      return NextResponse.json(
        { success: false, message: "Erro interno desconhecido ao cadastrar nova senha" },
        { status: 500 }
      );
    }
  }
}
