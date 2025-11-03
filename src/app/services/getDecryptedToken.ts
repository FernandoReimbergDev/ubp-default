/* eslint-disable @typescript-eslint/no-explicit-any */

import { API_REQ_PASSWORD, API_REQ_USER, ENVIRONMENT, STORE_ID, BASE_URL } from "../utils/env";
import { getCachedToken, isExpired, setTokenMeta } from "./token-store";

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
    try { json = text ? JSON.parse(text) : {}; } catch { /* noop */ }
    return { ok: res.ok, status: res.status, json, text };
  } finally {
    clearTimeout(to);
  }
}

/**
 * Obtém o token de autenticação pronto para uso nas APIs.
 * - Usa cache em memória (token-store) enquanto não expira.
 * - Se expirado/ausente, renova via fluxo externo: POST /token-generate -> POST /ubp-token.
 */
export async function getDecryptedToken(): Promise<string | null> {
  try {
    const cached = getCachedToken();
    if (cached && !isExpired()) {
      return cached;
    }

    const base = (BASE_URL?.trim() && /^https?:\/\//i.test(BASE_URL!))
      ? BASE_URL!.trim()
      : "https://unitybrindes.com.br";
    const baseUrl = new URL(base);
    const tokenGenerateURL = new URL("/token-generate", baseUrl).toString();
    const ubpTokenURL = new URL("/ubp-token", baseUrl).toString();

    if (!STORE_ID) {
      console.error("[getDecryptedToken] STORE_ID inválido");
      return null;
    }

    const basic = encodeBasic(API_REQ_USER, API_REQ_PASSWORD);

    // 1) token-generate
    const tg = await fetchJSON(
      tokenGenerateURL,
      {
        method: "POST",
        headers: {
          "X-Environment": ENVIRONMENT,
          "Content-Type": "application/json",
          Authorization: `Basic ${basic}`,
        },
      },
      8000
    );
    if (!tg.ok) {
      console.error("[getDecryptedToken] token-generate falhou", { status: tg.status, body: tg.text?.slice(0, 300) });
      return null;
    }

    const { token: generatedToken, expiresIn } = tg.json ?? {};
    if (!generatedToken || !expiresIn) {
      console.error("[getDecryptedToken] token-generate sem token/expiresIn");
      return null;
    }

    // 2) ubp-token
    const ubpBody = JSON.stringify({
      storeId: String(STORE_ID),
      expiresIn,
      token: generatedToken,
    });
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
    if (!ubp.ok) {
      // fallback: ainda tentar usar o generatedToken mesmo se /ubp-token falhar
      console.warn("[getDecryptedToken] ubp-token falhou, usando token do token-generate", { status: ubp.status });
      setTokenMeta({ token: generatedToken, expiresIn });
      return generatedToken as string;
    }

    const finalToken = ubp.json?.token ?? generatedToken;
    const finalExpiresIn = ubp.json?.expiresIn ?? expiresIn;
    setTokenMeta({ token: finalToken, expiresIn: finalExpiresIn });
    return finalToken as string;
  } catch (e: any) {
    console.error("[getDecryptedToken] Erro:", e?.message || e);
    return null;
  }
}
