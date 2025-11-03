// src/services/token-store.ts
let _expiresIn: string | null = null; // "YYYY-MM-DD HH:mm:ss"
let _token: string | null = null;

// converte "YYYY-MM-DD HH:mm:ss" -> epoch ms
function toEpochMs(s: string) {
    // garante formato ISO pra Date()
    const iso = s.replace(" ", "T"); // "2025-11-04 11:07:28" -> "2025-11-04T11:07:28"
    return new Date(iso).getTime();
}

export function setTokenMeta(params: { token?: string; expiresIn: string }) {
    if (params.token) _token = params.token;
    _expiresIn = params.expiresIn;
}

export function getExpiresIn(): string | null {
    return _expiresIn;
}

export function getCachedToken(): string | null {
    return _token;
}

export function isExpired(skewMs = 30_000): boolean {
    if (!_expiresIn) return true;
    const exp = toEpochMs(_expiresIn);
    return !Number.isFinite(exp) || Date.now() >= (exp - skewMs);
}
