import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "../../utils/env";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth")?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: "Token não encontrado" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const jti = payload.jti as string | undefined;

    if (!jti) {
      console.error("[api/jti] JTI não encontrado no payload. Payload:", JSON.stringify(payload, null, 2));
      return NextResponse.json({ success: false, message: "JTI não encontrado no token" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      jti,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[api/jti] Erro ao obter JTI:", errorMessage, error);
    return NextResponse.json({ success: false, message: `Token inválido: ${errorMessage}` }, { status: 401 });
  }
}
