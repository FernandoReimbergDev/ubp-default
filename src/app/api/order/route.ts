/* eslint-disable @typescript-eslint/no-explicit-any */
import https from "https";
import { NextResponse } from "next/server";
import { getDecryptedToken } from "../../services/getDecryptedToken";
import { ENVIRONMENT, STORE_ID, BASE_URL } from "../../utils/env";

const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 128,
  maxFreeSockets: 32,
  keepAliveMsecs: 15_000,
  timeout: 10_000,
});

async function withTimeout<T>(p: Promise<T>, ms: number, name = "operation"): Promise<T> {
  let to: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => (to = setTimeout(() => reject(new Error(`${name} timeout after ${ms}ms`)), ms)));
  try {
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(to!);
  }
}

function buildTargetUrl(req: Request): URL {
  const base = new URL(BASE_URL);
  const incoming = new URL(req.url);
  const target = new URL("/order", base);
  // Copia querystring do cliente
  target.search = incoming.search;
  // Garante que storeId do .env esteja sempre presente na query
  const params = target.searchParams;
  if (!params.has("storeId") && STORE_ID) {
    params.set("storeId", String(STORE_ID));
  }
  target.search = params.toString() ? `?${params.toString()}` : "";
  return target;
}

// Monta dinamicamente o corpo da requisição para a API externa a partir da query
function buildRequestBodyFromQuery(req: Request): Record<string, any> {
  const url = new URL(req.url);
  const qp = url.searchParams;
  const originContext = qp.get("context");

  // Mapa de aliases: nome do parâmetro na UI/URL -> nome esperado pela API externa
  const aliasMap: Record<string, string> = {
    pedido: "orderId",
    solicitante: "legalName",
    faturamento: "legalNameBilling",
    dataInicio: "createdAt",
    dataFinal: "createdAtEnd",
    orderStatus: "orderStatus",
    storeId: "storeId",
  };

  const body: Record<string, any> = {};

  // Garante storeId do .env se não vier na query
  const storeIdFromQuery = qp.get("storeId");
  const storeIdFinal = storeIdFromQuery ?? (STORE_ID ? String(STORE_ID) : undefined);
  if (storeIdFinal) {
    body.storeId = Number(storeIdFinal);
  }

  // Define orderStatus com prioridade para o valor informado; caso contrário aplica default por contexto
  const orderStatusParam = qp.get("orderStatus");
  if (orderStatusParam) {
    body.orderStatus = orderStatusParam;
  } else if (originContext === "pedido-aprovacao") {
    body.orderStatus = "Aguardando Aprovação";
  }

  // Transfere demais filtros dinamicamente (ignora apenas controles internos como "context")
  for (const [key, value] of qp.entries()) {
    if (key === "context" || key === "storeId" || key === "orderStatus") continue;
    const targetKey = aliasMap[key] ?? key;
    body[targetKey] = value;
  }

  return body;
}

export async function GET(req: Request) {
  try {
    const storeId = STORE_ID;
    if (!storeId) {
      return NextResponse.json({ success: false, message: "Dados inválidos." }, { status: 400 });
    }

    const token = await withTimeout(getDecryptedToken(), 2_000, "token");
    if (!token) {
      return NextResponse.json({ success: false, message: "Erro ao obter token de autenticação." }, { status: 500 });
    }

    const target = buildTargetUrl(req);

    // Monta body JSON dinamicamente conforme os filtros da query
    const requestBody = JSON.stringify(buildRequestBodyFromQuery(req));

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
            // A API externa exige parâmetros no corpo mesmo em GET
            "Content-Length": Buffer.byteLength(requestBody),
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
              console.error("[/order] non-2xx", { status, ctype, clen, preview: body?.slice(0, 300) });
              return reject(new Error(msg));
            }

            if (!body || body.trim() === "") {
              console.warn("[/order] body vazio", { status, ctype, clen });
              return resolve({ success: true, result: [] });
            }

            if (!ctype.toString().includes("application/json")) {
              console.warn("[/order] content-type não JSON", { status, ctype, clen, preview: body.slice(0, 120) });
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
              console.error("[/order] JSON.parse falhou", {
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
        // Envia body mesmo em GET, conforme contrato da API
        externalReq.write(requestBody);
        externalReq.end();
      }),
      6_000,
      "external"
    );

    return NextResponse.json({ success: true, data: responseData });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("Erro na rota /api/order:", message);
    return NextResponse.json({ success: false, message: "Erro ao buscar pedidos", details: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const storeIdEnv = STORE_ID;
    const bodyJson: any = await req.json().catch(() => ({}));
    const storeId = bodyJson?.storeId ?? storeIdEnv;
    const orderStatus = bodyJson?.orderStatus;

    if (!storeId) {
      return NextResponse.json({ success: false, message: "Dados inválidos (storeId)." }, { status: 400 });
    }

    const token = await withTimeout(getDecryptedToken(), 2_000, "token");
    if (!token) {
      return NextResponse.json({ success: false, message: "Erro ao obter token de autenticação." }, { status: 500 });
    }

    const base = new URL(BASE_URL);
    const target = new URL("/order", base);
    const postData = JSON.stringify({ storeId: Number(storeId), orderStatus });

    const responseData = await withTimeout<any>(
      new Promise((resolve, reject) => {
        const options: https.RequestOptions = {
          method: "POST",
          hostname: target.hostname,
          port: target.port ? Number(target.port) : undefined,
          path: target.pathname,
          agent,
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(postData),
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
              console.error("[/order POST] non-2xx", { status, ctype, clen, preview: body?.slice(0, 300) });
              return reject(new Error(msg));
            }

            if (!body || body.trim() === "") {
              console.warn("[/order POST] body vazio", { status, ctype, clen });
              return resolve({ success: true, result: [] });
            }

            if (!ctype.toString().includes("application/json")) {
              console.warn("[/order POST] content-type não JSON", { status, ctype, clen, preview: body.slice(0, 120) });
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
              console.error("[/order POST] JSON.parse falhou", {
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
        externalReq.write(postData);
        externalReq.end();
      }),
      6_000,
      "external"
    );

    return NextResponse.json({ success: true, data: responseData });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("Erro na rota /api/order (POST):", message);
    return NextResponse.json({ success: false, message: "Erro ao filtrar pedidos", details: message }, { status: 500 });
  }
}