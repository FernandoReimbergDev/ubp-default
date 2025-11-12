import type { CartItemPersist, PersonalizacaoPreco } from "@/app/types/cart";
import type { PrecoProduto } from "@/app/types/responseTypes";

/**
 * Função auxiliar para converter string/number para float
 */
export function toFloat(val: string | number | undefined | null): number | undefined {
  if (val === undefined || val === null) return undefined;
  const s = String(val).trim();
  const normalized = s.includes(",") && s.includes(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Encontra o preço do produto baseado na quantidade
 */
export function findPriceForQuantity(
  precos: PrecoProduto[] | undefined,
  vluGridPro: string | undefined,
  quantity: number
): { qtdiProPrc: string; qtdfProPrc: string; vluProPrc: string } {
  if (!precos || precos.length === 0) {
    return {
      qtdiProPrc: "1",
      qtdfProPrc: "0",
      vluProPrc: vluGridPro || "0",
    };
  }

  if (!quantity || quantity === 0) {
    return {
      ...precos[0],
      vluProPrc: vluGridPro || precos[0].vluProPrc,
    };
  }

  const foundPrice = precos.find((price) => {
    const qtdi = parseInt(price.qtdiProPrc) || 0;
    const qtdf = parseInt(price.qtdfProPrc) || 0;

    if (qtdf === 0 || qtdf >= 999999999) {
      return quantity >= qtdi;
    }

    return quantity >= qtdi && quantity <= qtdf;
  });

  return (
    foundPrice || {
      ...precos[0],
      vluProPrc: vluGridPro || precos[0].vluProPrc,
    }
  );
}

/**
 * Obtém o preço da personalização baseado na quantidade
 */
export function getPersonalizationUnitPrice(
  personalization: PersonalizacaoPreco[] | undefined,
  quantity: number
): number {
  if (!personalization?.length || !quantity || quantity <= 0) {
    if (personalization?.length) {
      return toFloat(personalization[0].vluPersonalPrc) ?? 0;
    }
    return 0;
  }

  const faixaEncontrada = personalization.find((faixa) => {
    const qtdi = parseInt(faixa.qtdiPersonalPrc) || 0;
    const qtdf = parseInt(faixa.qtdfPersonalPrc) || 0;

    if (qtdf === 0 || qtdf >= 999999999) {
      return quantity >= qtdi;
    }

    return quantity >= qtdi && quantity <= qtdf;
  });

  if (faixaEncontrada) {
    return toFloat(faixaEncontrada.vluPersonalPrc) ?? 0;
  }

  return toFloat(personalization[0].vluPersonalPrc) ?? 0;
}

/**
 * Recalcula o preço unitário efetivo baseado na quantidade atual
 */
export function recalculateEffectivePrice(item: CartItemPersist, quantity: number): number {
  let price = 0;

  // Busca o preço do produto baseado na quantidade atual
  if (quantity > 0) {
    const currentPrice = findPriceForQuantity(item.precos, item.vluGridPro, quantity);
    if (currentPrice) {
      price = parseFloat(currentPrice.vluProPrc) || 0;
    } else {
      price = item.unitPriceBase;
    }
  } else {
    price = item.unitPriceBase;
  }

  // Adiciona o valor da personalização se houver
  if (item.hasPersonalization && item.personalization && quantity > 0) {
    const personalizationPrice = getPersonalizationUnitPrice(item.personalization.precos, quantity);
    price += personalizationPrice;
  }

  // Adiciona o valor adicional da amostra se estiver marcado
  if (item.isAmostra && item.valorAdicionalAmostraPro) {
    price += parseFloat(item.valorAdicionalAmostraPro || "0");
  }

  return price;
}
