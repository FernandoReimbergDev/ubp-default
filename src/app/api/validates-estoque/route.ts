import { NextRequest, NextResponse } from "next/server";
import { Produto } from "@/app/types/responseTypes";

// mock para simular
const estoqueDisponivel: Record<string, number> = {
  "92293-AMIL": 10,
  "57253-amil": 0,
};

interface EstoqueRequestBody {
  produtos: Produto[];
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as EstoqueRequestBody;

  const faltaEstoque = body.produtos.some((produto) => {
    const estoque = estoqueDisponivel[produto.codPro] ?? 0;
    return produto.quantidade > estoque;
  });

  if (faltaEstoque) {
    return NextResponse.json({ success: false, message: "Produto não possui saldo suficiente" });
  }

  return NextResponse.json({ success: true });
}
