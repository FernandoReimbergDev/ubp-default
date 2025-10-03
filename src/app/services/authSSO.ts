import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { SSO_ENABLED } from "../utils/env";

export const authOptions: NextAuthOptions = {
  providers: SSO_ENABLED
    ? [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          // opcional: prompt/consent/hd etc.
          // authorization: { params: { prompt: "consent", access_type: "offline", response_type: "code" } },
        }),
      ]
    : [],
  session: {
    strategy: "jwt", // simples e sem banco; use Adapter se quiser "isNewUser" real
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Primeira vez no login: copiar dados do user pro token
      if (user) {
        token.id = user.id ?? token.sub;
        token.picture = user.image ?? token.picture;
      }
      // você pode acrescentar claims/custom aqui se precisar
      return token;
    },
    async session({ session, token }) {
      // Espelhar o token na sessão que vai pro client
      if (token) {
        session.user.id = (token.id as string) ?? token.sub ?? undefined;
        session.user.image = token.picture ?? session.user.image ?? null;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Após autenticar com o Google, registra/atualiza na sua API (idempotente)
      try {
        // Monte payload mínimo (LGPD: só o necessário)
        const payload = {
          provider: account?.provider,
          providerAccountId: account?.providerAccountId,
          name: user.name,
          email: user.email,
          image: user.image,
          // opcional: profile info útil
        };

        // Chame uma rota interna (proxy) para evitar CORS e esconder BACKEND_URL
        await fetch(`${process.env.NEXTAUTH_URL}/api/users/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        return true;
      } catch (e) {
        console.error("Falha ao registrar usuário:", e);
        // retornar false bloqueia o login; melhor deixar true e logar erro
        return true;
      }
    },
  },
  // pages: { signIn: "/sign-in" }, // se quiser página custom
};
