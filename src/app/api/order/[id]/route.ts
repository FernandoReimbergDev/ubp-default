/* eslint-disable @typescript-eslint/no-explicit-any */
import https from "https";
import { NextResponse } from "next/server";
import { getDecryptedToken } from "../../../services/getDecryptedToken";
import { ENVIRONMENT, STORE_ID, BASE_URL } from "../../../utils/env";

const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 128,
  maxFreeSockets: 32,
  keepAliveMsecs: 15_000,
  timeout: 10_000,
});

async function withTimeout<T>(p: Promise<T>, ms: number, name = "operation"): Promise<T> {
  let to: NodeJS.Timeout;
  const timeout = new Promise<never>(
    (_, reject) => (to = setTimeout(() => reject(new Error(`${name} timeout after ${ms}ms`)), ms))
  );
  try {
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(to!);
  }
}

function buildTargetUrl(id: string, req: Request): URL {
  const base = new URL(BASE_URL);
  const incoming = new URL(req.url);
  const target = new URL(`/order/${encodeURIComponent(id)}`, base);
  target.search = incoming.search;
  return target;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const storeId = STORE_ID;
    if (!storeId) {
      return NextResponse.json({ success: false, message: "Dados inválidos." }, { status: 400 });
    }

    const token = await withTimeout(getDecryptedToken(), 2_000, "token");
    if (!token) {
      return NextResponse.json({ success: false, message: "Erro ao obter token de autenticação." }, { status: 500 });
    }

    const { id } = await params;
    const target = buildTargetUrl(id, req);

    const responseData = await withTimeout<any>(
      new Promise((resolve, reject) => {
        const options: https.RequestOptions = {
          method: "GET",
          hostname: target.hostname,
          port: target.port ? Number(target.port) : undefined,
          path: `${target.pathname}${target.search}`,
          agent,
          headers: {
            "Content-Type": "application/json",
            "X-Environment": ENVIRONMENT,
            Authorization: `Bearer ${token}`,
            Connection: "keep-alive",
            "Cache-Control": "no-cache",
            Accept: "application/json",
          },
        };

        const externalReq = https.request(options, (res) => {
          let body = "";
          res.setEncoding("utf8");
          res.socket?.setNoDelay(true);

          res.on("data", (chunk: string) => (body += chunk));
          res.on("aborted", () => reject(new Error("Resposta abortada pela origem")));
          res.on("end", () => {
            const status = res.statusCode ?? 0;
            const ctype = res.headers["content-type"] || "";
            const clen = res.headers["content-length"];

            if (status < 200 || status >= 300) {
              let msg = `Erro da API externa (${status})`;
              try {
                if (body && ctype.toString().includes("application/json")) {
                  const errJson = JSON.parse(body);
                  msg = errJson?.message || msg;
                }
              } catch {}
              console.error("[/order/:id] non-2xx", { status, ctype, clen, preview: body?.slice(0, 300) });
              return reject(new Error(msg));
            }

            if (!body || body.trim() === "") {
              console.warn("[/order/:id] body vazio", { status, ctype, clen });
              return resolve({ success: true, result: [] });
            }

            if (!ctype.toString().includes("application/json")) {
              console.warn("[/order/:id] content-type não JSON", { status, ctype, clen, preview: body.slice(0, 120) });
              try {
                const parsedAnyway = JSON.parse(body);
                return resolve(parsedAnyway);
              } catch {
                return resolve({ success: true, raw: body });
              }
            }

            try {
              const parsed = JSON.parse(body);
              return resolve(parsed);
            } catch (e: any) {
              console.error("[/order/:id] JSON.parse falhou", {
                status,
                ctype,
                clen,
                err: e?.message,
                preview: body.slice(0, 200),
              });
              return reject(new Error(`Erro ao interpretar resposta da API externa: ${e?.message || e}`));
            }
          });

          res.on("error", (err) => reject(err));
        });

        externalReq.setTimeout(4_000, () => externalReq.destroy(new Error("External request timeout")));
        externalReq.on("socket", (s) => s.setNoDelay(true));
        externalReq.on("error", (err) => reject(err));
        externalReq.end();
      }),
      6_000,
      "external"
    );

    return NextResponse.json({ success: true, data: responseData });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("Erro na rota /api/order/:id:", message);
    return NextResponse.json({ success: false, message: "Erro ao buscar pedido", details: message }, { status: 500 });
  }
}
