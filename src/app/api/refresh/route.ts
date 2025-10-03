import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import { JWT_SECRET, JWT_REFRESH_SECRET } from "../../utils/env";
import { decrypt } from "../../services/cryptoCookie";

export async function GET(req: NextRequest) {
  const encryptedToken = req.cookies.get("refreshToken")?.value;

  if (!encryptedToken) {
    return NextResponse.json({ success: false, message: "Refresh token ausente." }, { status: 401 });
  }

  try {
    const decrypted = decrypt(encryptedToken);

    // Valida e extrai o payload completo do refresh token
    const refreshSecret = new TextEncoder().encode(JWT_REFRESH_SECRET);
    const { payload } = await jwtVerify(decrypted, refreshSecret);

    // Gera novo accessToken leve para o middleware
    const secret = new TextEncoder().encode(JWT_SECRET);
    const newAccessToken = await new SignJWT({
      sub: typeof payload.id === "string" ? payload.id : String(payload.id ?? ""),
      name: typeof payload.firstName === "string" ? payload.firstName : "Usuário",
      iss: "unitybrindes",
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime("15m")
      .sign(secret);

    // Troca para garantir que cookies sejam setados corretamente
    const res = new NextResponse(JSON.stringify({ success: true, message: "Token renovado com sucesso" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

    res.cookies.set("auth", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 15,
      sameSite: "lax",
    });

    return res;
  } catch (error) {
    console.error("Erro ao renovar token:", error);
    return NextResponse.json({ success: false, message: "Refresh token inválido ou expirado." }, { status: 403 });
  }
}
