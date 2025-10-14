import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "./app/utils/env";

// --- Config --- //
const REDIRECT_WHEN_NOT_AUTHENTICATED_ROUTE = "/sign-in";

// Rotas públicas EXATAS (sem sufixo)
const publicRoutes = [
  { path: "/sign-in", whenAuthenticated: "redirect" as const },
  { path: "/politica-de-cookies", whenAuthenticated: "next" as const },
  { path: "/politica-de-privacidade", whenAuthenticated: "next" as const },
  { path: "/termos-de-uso", whenAuthenticated: "next" as const },
];

// Prefixos públicos (qualquer rota que COMEÇA com isso é pública)
const publicPrefixes = ["/public", "/assets"];

// Se você usa NextAuth, garanta que isso fique público também:
// const nextAuthPublic = ["/api/auth"]; // com seu matcher atual isso já está fora, mas deixo a nota.

// --- Helpers --- //
function isPublicExact(pathname: string) {
  return publicRoutes.find((r) => r.path === pathname) ?? null;
}

function isPublicByPrefix(pathname: string) {
  return publicPrefixes.some((prefix) => pathname.startsWith(prefix));
}

function buildRedirect(url: URL, pathname: string, callbackTo?: string) {
  const redirectUrl = new URL(url);
  redirectUrl.pathname = pathname;

  // Preserva para onde voltar após login (evita laço em rotas públicas)
  if (callbackTo && pathname === REDIRECT_WHEN_NOT_AUTHENTICATED_ROUTE) {
    redirectUrl.searchParams.set("callbackUrl", callbackTo);
  }
  return redirectUrl;
}

async function isValidJwt(token?: string) {
  if (!token) return false;
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    // jwtVerify já valida 'exp' automaticamente se existir
    await jwtVerify(token, secret);
    return true;
  } catch (err) {
    console.warn("[Middleware] Token inválido/expirado:", err);
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

// --- Middleware --- //
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const currentFullUrl = `${pathname}${search || ""}`;

  // 1) Liberar rotas públicas (exatas e por prefixo)
  const publicExact = isPublicExact(pathname);
  const isPublicPrefix = isPublicByPrefix(pathname);

  // 2) Checar autenticação via cookie 'auth'
  const accessToken = request.cookies.get("auth")?.value;
  const isAuthenticated = await isValidJwt(accessToken);
  const payload = isAuthenticated ? await readJwtPayload(accessToken) : null;
  const rolesFromJwt = (payload?.role ?? payload?.roles ?? []) as unknown; // suporta roles como string/string[]/objetos
  if (process.env.NODE_ENV !== "production") {
    console.log("[MW] payload:", payload);
    console.log("[MW] rolesFromJwt raw:", rolesFromJwt);
  }

  // 3) Regras para rotas públicas
  if (publicExact || isPublicPrefix) {
    // Se autenticado e rota pública pede redirect (ex.: /sign-in), manda pra home
    if (isAuthenticated && publicExact?.whenAuthenticated === "redirect") {
      const to = buildRedirect(request.nextUrl, "/", undefined);
      return NextResponse.redirect(to);
    }
    // Caso contrário, deixa passar
    return NextResponse.next();
  }

  // 4) Regras para rotas privadas → exige login
  if (!isAuthenticated) {
    // Evita loop caso já esteja indo para a página de login
    if (pathname === REDIRECT_WHEN_NOT_AUTHENTICATED_ROUTE) {
      return NextResponse.next();
    }
    const to = buildRedirect(request.nextUrl, REDIRECT_WHEN_NOT_AUTHENTICATED_ROUTE, currentFullUrl);
    return NextResponse.redirect(to);
  }

  // 5) Autenticado e rota privada → checar roles por rota
  // Mapa simples de ACL por pathname exato ou por prefixo se necessário
  const acl: { path: string; required: string | string[] }[] = [
    { path: "/adicionar-usuario", required: ["Administrador"] },
  ];

  const rule = acl.find((r) => r.path === pathname);
  if (rule) {
    if (process.env.NODE_ENV !== "production") {
      // Log de diagnóstico em dev
      console.log("[ACL] pathname:", pathname, "roles:", normalizeRoles(rolesFromJwt), "required:", rule.required);
    }
  }
  if (rule && !userHasAnyRequiredRole(rolesFromJwt, rule.required)) {
    // Redireciona para página de não autorizado
    return NextResponse.redirect(new URL("/not-autorized", request.url));
  }

  // Caso passe, segue o baile
  return NextResponse.next();
}

// --- Matcher --- //
// Mantém fora do middleware as pastas padrão e arquivos públicos; você pode ajustar conforme seu projeto
export const config = {
  matcher: [
    // Aplica a todas as rotas, exceto:
    //  - api (suas rotas de API)    → se quiser proteger /api/private, trate no matcher abaixo
    //  - _next/static e _next/image → assets do Next
    //  - favicon e sitemaps/robots
    //  - public/assets já tratados por prefixo acima (e aqui, por exclusão)
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|public/|assets/).*)",

    // Se quiser PROTEGER um segmento de API, adicione aqui explicitamente:
    // "/api/private/:path*",
  ],
};
