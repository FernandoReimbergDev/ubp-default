// src/app/api/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "../../utils/env";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth")?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: "Token não encontrado" }, { status: 401 });
    }

    // Validar JWT
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    // Aqui você pode buscar dados mais completos do usuário se necessário
    // Por enquanto, retornando o que já temos no payload
    const userId = payload.sub;
    const roles = normalizeRoles(payload.role || []);

    return NextResponse.json({
      success: true,
      user: { id: userId },
      roles: roles,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Token inválido" }, { status: 401 });
  }
}

function normalizeRoles(userRoles: unknown): string[] {
  if (!userRoles) return [];
  const list = Array.isArray(userRoles) ? userRoles : [userRoles];
  return list
    .map((r) => {
      if (typeof r === "string") return r;
      if (r && typeof r === "object" && "name" in r && typeof (r as any).name === "string") {
        return (r as any).name as string;
      }
      return undefined;
    })
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.toLowerCase());
}
