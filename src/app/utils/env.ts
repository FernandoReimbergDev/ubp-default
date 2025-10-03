function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(`[ENV ERROR] Variável de ambiente '${key}' não está definida.`);
    throw new Error(`Variável de ambiente '${key}' ausente`);
  }
  return value;
}

export const API_REQ_USER = requireEnv("API_REQ_USER");
export const API_REQ_PASSWORD = requireEnv("API_REQ_PASSWORD");
export const TOKEN_SECRET = requireEnv("TOKEN_SECRET");
export const ENVIRONMENT = requireEnv("ENVIRONMENT");
export const STORE_ID = requireEnv("STORE_ID");
export const API_REQ_APPLICATION = requireEnv("API_REQ_APPLICATION");
export const JWT_SECRET = requireEnv("JWT_SECRET");
export const JWT_REFRESH_SECRET = requireEnv("JWT_REFRESH_SECRET");
export const COOKIE_ENCRYPTION_SECRET = requireEnv("JWT_REFRESH_SECRET");

// Configurações de pagamento
export const LIMITE_PARCELAMENTO = parseInt(requireEnv("LIMITE_PARCELAMENTO"), 10);
export const TAXA_JUROS = parseFloat(requireEnv("TAXA_JUROS"));

// Configurações de autenticação social
export const SSO_ENABLED = requireEnv("SSO_ENABLED");
