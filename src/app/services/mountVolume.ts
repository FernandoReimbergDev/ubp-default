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
 * Assumindo:
 * - altura/largura/comprimento em cm
 * - peso em kg
 * - retorna lado/alt/larg/comp em cm e pesoTotal em gramas
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
    pesoTotal: number; // em gramas
    altura: number; // cm
    largura: number; // cm
    comprimento: number; // cm
} {
    let volumeTotal = 0;    // cm^3
    let pesoTotalTemp = 0;  // kg

    for (const item of cart) {
        const qty = parseInt(quantities[item.id] || "0", 10);
        if (!Number.isFinite(qty) || qty <= 0) continue;

        const h = toNumberBR(item.altura) ?? 0;
        const w = toNumberBR(item.largura) ?? 0;
        const l = toNumberBR(item.comprimento) ?? 0;
        const kg = toNumberBR(item.peso) ?? 0;

        // volume de 1 peça (cm³)
        const productVolume = h * w * l;
        // volume total do item considerando quantidade
        const productVolumeTotal = productVolume * qty;
        // peso total do item (kg)
        const productWeight = kg * qty;

        volumeTotal += productVolumeTotal;
        pesoTotalTemp += productWeight;
    }

    // caixa cúbica
    const ladoAprox = Math.pow(Math.max(volumeTotal, 0), 1 / 3);        // cm
    const ladoArred2 = Number(ladoAprox.toFixed(2));
    const lado = Math.ceil(ladoArred2);                                  // inteiro em cm

    const altura = lado;
    const largura = lado;
    const comprimento = lado;

    // peso total em gramas
    const pesoTotal = Math.round(pesoTotalTemp * 1000);

    return { volumeTotal, pesoTotal, altura, largura, comprimento };
}