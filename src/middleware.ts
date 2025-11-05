/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "./app/utils/env";

const REDIRECT_WHEN_NOT_AUTHENTICATED_ROUTE = "/sign-in";

const publicRoutes = [
  { path: "/sign-in", whenAuthenticated: "redirect" as const },
  { path: "/politica-de-cookies", whenAuthenticated: "next" as const },
  { path: "/politica-de-privacidade", whenAuthenticated: "next" as const },
  { path: "/termos-de-uso", whenAuthenticated: "next" as const },
  { path: "/fale-conosco", whenAuthenticated: "next" as const },
];

const publicPrefixes = ["/public", "/assets"];

// ==== Helpers de header (use SEMPRE o mesmo response) ====
function applySecurityHeaders(res: NextResponse) {
  // Só features estáveis aqui (nada de Privacy Sandbox / Ads)
  res.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=()"
  );
  // (opcional) outros headers seguros
  // res.headers.set("X-Content-Type-Options", "nosniff");
  // res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // res.headers.set("X-Frame-Options", "DENY");
  return res;
}

function isPublicExact(pathname: string) {
  return publicRoutes.find((r) => r.path === pathname) ?? null;
}
function isPublicByPrefix(pathname: string) {
  return publicPrefixes.some((prefix) => pathname.startsWith(prefix));
}
function buildRedirect(url: URL, pathname: string, callbackTo?: string) {
  const redirectUrl = new URL(url);
  redirectUrl.pathname = pathname;
  if (callbackTo && pathname === REDIRECT_WHEN_NOT_AUTHENTICATED_ROUTE) {
    redirectUrl.searchParams.set("callbackUrl", callbackTo);
  }
  return redirectUrl;
}

async function isValidJwt(token?: string) {
  if (!token) return false;
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

async function readJwtPayload(token?: string): Promise<Record<string, unknown> | null> {
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as Record<string, unknown>;
  } catch {
    return null;
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

function userHasAnyRequiredRole(userRoles: unknown, required: string | string[]): boolean {
  const roles = normalizeRoles(userRoles);
  if (!roles.length) return false;
  const requiredList = (Array.isArray(required) ? required : [required]).map((r) => r.toLowerCase());
  return roles.some((role) => requiredList.includes(role));
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const currentFullUrl = `${pathname}${search || ""}`;

  const publicExact = isPublicExact(pathname);
  const isPublicPrefix = isPublicByPrefix(pathname);

  const accessToken = request.cookies.get("auth")?.value;
  const isAuthenticated = await isValidJwt(accessToken);
  const payload = isAuthenticated ? await readJwtPayload(accessToken) : null;
  const rolesFromJwt = (payload?.role ?? payload?.roles ?? []) as unknown;

  // Rotas públicas
  if (publicExact || isPublicPrefix) {
    if (isAuthenticated && publicExact?.whenAuthenticated === "redirect") {
      const to = buildRedirect(request.nextUrl, "/", undefined);
      const redir = NextResponse.redirect(to);
      return applySecurityHeaders(redir);
    }
    const pass = NextResponse.next();
    return applySecurityHeaders(pass);
  }

  // Rotas privadas: exige login
  if (!isAuthenticated) {
    if (pathname === REDIRECT_WHEN_NOT_AUTHENTICATED_ROUTE) {
      const pass = NextResponse.next();
      return applySecurityHeaders(pass);
    }
    const to = buildRedirect(request.nextUrl, REDIRECT_WHEN_NOT_AUTHENTICATED_ROUTE, currentFullUrl);
    const redir = NextResponse.redirect(to);
    return applySecurityHeaders(redir);
  }

  // ACL simples
  const acl: { path: string; required: string | string[] }[] = [
    { path: "/adicionar-usuario", required: ["Administrador"] },
  ];
  const rule = acl.find((r) => r.path === pathname);
  if (rule && !userHasAnyRequiredRole(rolesFromJwt, rule.required)) {
    const redir = NextResponse.redirect(new URL("/not-autorized", request.url));
    return applySecurityHeaders(redir);
  }

  const pass = NextResponse.next();
  return applySecurityHeaders(pass);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|public/|assets/).*)",
  ],
};
