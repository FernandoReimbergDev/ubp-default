/* eslint-disable @typescript-eslint/no-explicit-any */
// Cliente HTTP central baseado em fetch, com suporte a ambientes e tipagem genérica

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RequestOptions = {
  method?: HttpMethod;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown; // será serializado como JSON por padrão
  signal?: AbortSignal;
  // Quando precisar enviar algo diferente de JSON, sobrescreva contentType
  contentType?: string | null;
  // Tempo de timeout (ms) — se não fornecido, usa o padrão do env
  timeoutMs?: number;
  // Se quiser bypass do baseURL e passar uma URL completa
  absoluteUrl?: string;
};

export type ApiError = {
  status: number;
  message: string;
  details?: any;
  error?: string;
};

// Resolve baseURL usando NEXT_PUBLIC_* no cliente e sem prefixo no server
const resolveBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_BASE_URL || "";
  }
  return process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
};

const defaultTimeout = (() => {
  const val = process.env.NEXT_PUBLIC_API_TIMEOUT_MS || process.env.API_TIMEOUT_MS;
  const num = val ? Number(val) : NaN;
  return Number.isFinite(num) ? num : 15000; // 15s padrão
})();

const buildUrl = (base: string, path: string, params?: RequestOptions["params"]): string => {
  // Se base estiver vazio ou inválido, constrói URL relativa
  const hasBase = typeof base === "string" && base.trim().length > 0;
  const safePath = path.startsWith("/") ? path : `/${path}`;

  if (!hasBase) {
    const search = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        search.set(k, String(v));
      });
    }
    const qs = search.toString();
    return qs ? `${safePath}?${qs}` : safePath;
  }

  // Caso tenha base válido, usa composição absoluta
  const baseFixed = base.replace(/\/+$/, "/");
  const url = new URL(safePath.replace(/^\/+/, ""), baseFixed + "/");
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
};

export async function apiRequest<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = resolveBaseUrl();
  const method = options.method || "GET";
  const timeoutMs = options.timeoutMs ?? defaultTimeout;

  // Monta URL final
  const url = options.absoluteUrl ? options.absoluteUrl : buildUrl(baseUrl, path, options.params);

  // Headers padrão
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.contentType === null ? {} : { "Content-Type": options.contentType || "application/json" }),
    ...(options.headers || {}),
  };

  // Token opcional (se existir no env)
  const token = typeof window !== "undefined" ? process.env.NEXT_PUBLIC_API_TOKEN : process.env.API_TOKEN;
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Serialização do corpo
  const body =
    options.body === undefined || method === "GET"
      ? undefined
      : headers["Content-Type"] === "application/json" && options.body && typeof options.body !== "string"
      ? JSON.stringify(options.body)
      : (options.body as any);

  // Timeout por AbortController
  const ac = new AbortController();
  const timeout = setTimeout(() => ac.abort(), timeoutMs);
  const signal = options.signal ?? ac.signal;

  let resp: Response;
  try {
    resp = await fetch(url, {
      method,
      headers,
      body,
      signal,
      credentials: "include", // envia cookies se necessários
    });
  } catch (err: any) {
    clearTimeout(timeout);
    const isAbort = err?.name === "AbortError";
    const apiErr: ApiError = {
      status: isAbort ? 408 : 0,
      message: isAbort ? "Tempo de requisição excedido" : "Falha de rede ao conectar à API",
      details: err,
    };
    throw apiErr;
  }
  clearTimeout(timeout);

  const contentType = resp.headers.get("content-type") || "";

  // Sempre que possível, tenta ler JSON
  const canParseJson = contentType.includes("application/json");
  if (!resp.ok) {
    let details: any = undefined;
    try {
      details = canParseJson ? await resp.json() : await resp.text();
    } catch {
      // ignora erro de parsing
    }
    const apiErr: ApiError = {
      status: resp.status,
      message: typeof details === "string" && details.length ? details : `Erro na API (${resp.status})`,
      details: typeof details === "string" ? { raw: details } : details,
    };
    throw apiErr;
  }

  if (resp.status === 204) {
    // No Content
    return undefined as unknown as T;
  }

  if (canParseJson) {
    return (await resp.json()) as T;
  }

  // Se a API prometeu sempre JSON, mas não retornou content-type JSON,
  // ainda tenta decodificar; senão, lança erro para não mascarar problemas.
  try {
    return JSON.parse(await resp.text()) as T;
  } catch (e: unknown) {
    const error = e as Error;
    const apiErr: ApiError = {
      status: resp.status,
      message: "Resposta não está em JSON conforme esperado",
      details: { contentType, hint: "Verifique o serviço da API" },
      error: error.message,
    };
    throw apiErr;
  }
}

// Helpers específicos por método
export const apiGet = <T = unknown>(path: string, options: Omit<RequestOptions, "method" | "body"> = {}) =>
  apiRequest<T>(path, { ...options, method: "GET" });

export const apiPost = <T = unknown>(
  path: string,
  body?: unknown,
  options: Omit<RequestOptions, "method" | "body"> = {}
) => apiRequest<T>(path, { ...options, method: "POST", body });

export const apiPut = <T = unknown>(
  path: string,
  body?: unknown,
  options: Omit<RequestOptions, "method" | "body"> = {}
) => apiRequest<T>(path, { ...options, method: "PUT", body });

export const apiPatch = <T = unknown>(
  path: string,
  body?: unknown,
  options: Omit<RequestOptions, "method" | "body"> = {}
) => apiRequest<T>(path, { ...options, method: "PATCH", body });

export const apiDelete = <T = unknown>(path: string, options: Omit<RequestOptions, "method" | "body"> = {}) =>
  apiRequest<T>(path, { ...options, method: "DELETE" });
