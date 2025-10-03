function requireEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        console.error(`[ENV ERROR] Variável de ambiente '${key}' não está definida.`);
        throw new Error(`Variável de ambiente '${key}' ausente`);
    }
    return value;
}

export const JWT_SECRET = requireEnv("JWT_SECRET");
export const JWT_REFRESH_SECRET = requireEnv("JWT_REFRESH_SECRET");
export const DB_HOST = requireEnv("DB_HOST");
export const DB_USER = requireEnv("DB_USER");
export const DB_PASSWORD = requireEnv("DB_PASSWORD");
export const DB_NAME = requireEnv("DB_NAME");
export const DB_PORT = requireEnv("DB_PORT");
export const SMTP_HOST = requireEnv("SMTP_HOST");
export const SMTP_PORT = requireEnv("SMTP_PORT");
export const SMTP_USER = requireEnv("SMTP_USER");
export const SMTP_PASS = requireEnv("SMTP_PASS");
export const EMAIL_HOST = requireEnv("EMAIL_HOST");
export const EMAIL_PORT = requireEnv("EMAIL_PORT");
export const EMAIL_USER = requireEnv("EMAIL_USER");
export const EMAIL_PASS = requireEnv("EMAIL_PASS");


