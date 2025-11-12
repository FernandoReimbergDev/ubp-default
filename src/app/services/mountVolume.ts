// conversor simples BR -> número
export function toNumberBR(val?: string | number | null): number | undefined {
  if (val === undefined || val === null) return undefined;
  const s = String(val).trim();
  if (!s) return undefined;
  if (s.includes(".") && s.includes(",")) return Number(s.replace(/\./g, "").replace(",", "."));
  if (s.includes(",")) return Number(s.replace(",", "."));
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Calcula volume e peso total do carrinho e propõe uma caixa cúbica equivalente.
 * Segue a mesma lógica do código PHP:
 * - Calcula volume total (altura × largura × comprimento × quantidade) de cada produto
 * - Calcula peso total (peso × quantidade) de cada produto
 * - Cria uma caixa quadrada usando a raiz cúbica do volume total
 * - Arredonda para 2 casas decimais e depois usa ceil() para cada dimensão
 *
 * IMPORTANTE:
 * - O peso do banco vem em kg (ex: "0.040" = 0.04kg = 40g)
 * - Converte para gramas multiplicando por 1000
 * - Multiplica pela quantidade
 * - Retorna peso total em gramas (sem ponto decimal)
 *
 * Exemplo: produto com 40g (0.040kg) × 150 unidades = 6000g
 *
 * Assumindo:
 * - altura/largura/comprimento em cm
 * - peso do banco em kg
 * - retorna dimensões em cm e pesoTotal em gramas (inteiro, sem ponto decimal)
 */
export function getPackageVolumeAndWeight(
  cart: Array<{
    altura?: string;
    largura?: string;
    comprimento?: string;
    peso?: string;
    id: string;
  }>,
  quantities: Record<string, string>
): {
  volumeTotal: number;
  pesoTotal: number; // em gramas (inteiro, sem ponto decimal)
  altura: number; // cm
  largura: number; // cm
  comprimento: number; // cm
} {
  let volumeTotal = 0; // cm^3
  let pesoTotalGramas = 0; // gramas (acumulamos direto em gramas)

  for (const item of cart) {
    const qty = parseInt(quantities[item.id] || "0", 10);
    if (!Number.isFinite(qty) || qty <= 0) continue;

    const h = toNumberBR(item.altura) ?? 0;
    const w = toNumberBR(item.largura) ?? 0;
    const l = toNumberBR(item.comprimento) ?? 0;

    // O peso do banco vem em kg (ex: "0.040" = 0.04kg)
    const pesoKg = toNumberBR(item.peso) ?? 0;
    // Converte para gramas multiplicando por 1000
    // Exemplo: 0.040kg × 1000 = 40g
    const pesoGramas = pesoKg * 1000;

    // Log para debug
    if (pesoKg > 0) {
      console.log(
        `Produto ${item.id}: peso="${item.peso}" (${pesoKg}kg = ${pesoGramas}g), qty=${qty}, total=${pesoGramas * qty}g`
      );
    }

    // volume de 1 peça (cm³)
    const productVolume = h * w * l;
    // volume total do item considerando quantidade
    const productVolumeTotal = productVolume * qty;
    // peso total do item em gramas (peso em gramas × quantidade)
    // Exemplo: 40g × 150 unidades = 6000g
    const productWeightGrams = pesoGramas * qty;

    volumeTotal += productVolumeTotal;
    pesoTotalGramas += productWeightGrams;
  }

  // Criando uma caixa quadrada
  // PHP: $lado = round(pow($volumeTotal, 1 / 3), 2);
  const lado = Math.round(Math.pow(Math.max(volumeTotal, 0), 1 / 3) * 100) / 100;

  // PHP: $altura = ceil($lado); $largura = ceil($lado); $comprimento = ceil($lado);
  const altura = Math.ceil(lado);
  const largura = Math.ceil(lado);
  const comprimento = Math.ceil(lado);

  // peso total já está em gramas (não precisa multiplicar por 1000 novamente)
  // Arredonda para garantir número inteiro (sem ponto decimal)
  // PHP: $pesoTotal = round($pesoTotalTemp * 1000);
  const pesoTotal = Math.round(pesoTotalGramas);

  // Log para debug
  console.log(`mountVolume: pesoTotal=${pesoTotal}g, volumeTotal=${volumeTotal}cm³`);

  return { volumeTotal, pesoTotal, altura, largura, comprimento };
}
