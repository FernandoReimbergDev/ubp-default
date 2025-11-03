/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import {
  API_REQ_USER,
  API_REQ_PASSWORD,
  ENVIRONMENT,
  STORE_ID,
  BASE_URL,
} from "../../utils/env";
import { setTokenMeta } from "../../services/token-store";
function encodeBasic(user: string, pass: string) {
  return Buffer.from(`${user}:${pass}`).toString("base64");
}

async function fetchJSON(url: string, init: RequestInit, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    const text = await res.text();
    let json: any = {};
    try { json = text ? JSON.parse(text) : {}; } catch { /* mantém json = {} */ }
    return { ok: res.ok, status: res.status, json, text };
  } finally {
    clearTimeout(to);
  }
}

export async function POST() {
  const t0 = Date.now();
  try {
    const base = (BASE_URL?.trim() && /^https?:\/\//i.test(BASE_URL!))
      ? BASE_URL!.trim()
      : "https://unitybrindes.com.br";
    const baseUrl = new URL(base);
    const tokenGenerateURL = new URL("/token-generate", baseUrl).toString();
    const ubpTokenURL = new URL("/ubp-token", baseUrl).toString();

    if (!STORE_ID) {
      return NextResponse.json({ success: false, message: "STORE_ID inválido." }, { status: 400 });
    }

    // 1) /token-generate (Basic)
    const basic = encodeBasic(API_REQ_USER, API_REQ_PASSWORD);
    const tgStart = Date.now();
    const tg = await fetchJSON(
      tokenGenerateURL,
      {
        method: "POST",
        headers: {
          "X-Environment": ENVIRONMENT,
          "Content-Type": "application/json",
          Authorization: `Basic ${basic}`,
        },
        // body vazio conforme fluxo atual
      },
      8000
    );
    const tokenGenerateMs = Date.now() - tgStart;

    if (!tg.ok) {
      console.error("Erro /token-generate:", { status: tg.status, body: tg.text?.slice(0, 500) });
      return NextResponse.json(
        { success: false, stage: "token-generate", status: tg.status, details: tg.json },
        { status: tg.status }
      );
    }

    const { token: generatedToken, expiresIn } = tg.json ?? {};
    if (!generatedToken || !expiresIn) {
      return NextResponse.json(
        { success: false, message: "Resposta inválida de /token-generate (faltando token/expiresIn)" },
        { status: 502 }
      );
    }

    // 2) /ubp-token (Basic) — envia token/expiresIn/STORE_ID no corpo
    const ubpBody = JSON.stringify({
      storeId: String(STORE_ID),
      expiresIn,
      token: generatedToken,
    });

    const ubpStart = Date.now();
    const ubp = await fetchJSON(
      ubpTokenURL,
      {
        method: "POST",
        headers: {
          "X-Environment": ENVIRONMENT,
          "Content-Type": "application/json",
          Authorization: `Basic ${basic}`,
        },
        body: ubpBody,
      },
      8000
    );
    const ubpTokenMs = Date.now() - ubpStart;

    if (!ubp.ok) {
      console.error("Erro /ubp-token:", { status: ubp.status, body: ubp.text?.slice(0, 500) });
      return NextResponse.json(
        { success: false, stage: "ubp-token", status: ubp.status, details: ubp.json },
        { status: ubp.status }
      );
    }

    // token final: se /ubp-token retornar outro token/expiração, usamos; senão, mantemos o do token-generate
    const finalToken = ubp.json?.token ?? generatedToken;
    const finalExpiresIn = ubp.json?.expiresIn ?? expiresIn;
    setTokenMeta({ token: finalToken, expiresIn: finalExpiresIn });

    const totalMs = Date.now() - t0;
    if (totalMs > 500) {
      console.log("[token-refresh no-db] timings(ms)", {
        token_generate_ms: tokenGenerateMs,
        ubp_token_ms: ubpTokenMs,
        total_ms: totalMs,
      });
    }

    // ✅ FIM DO FLUXO — sem salvar em lugar nenhum
    return NextResponse.json(
      {
        success: true,
        token: finalToken,
        expiresIn: finalExpiresIn,
        timings: {
          token_generate_ms: tokenGenerateMs,
          ubp_token_ms: ubpTokenMs,
          total_ms: totalMs,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Erro interno:", err?.message || err);
    return NextResponse.json(
      { success: false, message: "Erro interno", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
