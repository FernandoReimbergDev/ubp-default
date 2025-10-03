import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validação mínima (LGPD: minimização de dados)
    if (!body?.email) {
      return NextResponse.json({ error: "email obrigatório" }, { status: 400 });
    }

    // Repassa para o seu backend real
    const r = await fetch(`${process.env.BACKEND_URL}/usuarios/registrar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Se precisar de auth interna:
      // headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.INTERNAL_TOKEN}` },
      body: JSON.stringify({
        email: body.email,
        name: body.name,
        image: body.image,
        provider: body.provider,
        providerAccountId: body.providerAccountId,
      }),
    });

    // Trate respostas do backend
    if (!r.ok) {
      const err = await r.text().catch(() => "erro desconhecido");
      return NextResponse.json({ error: err }, { status: r.status });
    }

    const data = await r.json().catch(() => ({}));
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "erro no proxy" }, { status: 500 });
  }
}
