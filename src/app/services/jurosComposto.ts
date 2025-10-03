export function twoDecimal(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

export function Juros_composto(valor_inicial: number, periodo: number, juros: number) {
  if (Number(periodo) > 1) {
    const I = juros / 100.0;
    const capital = twoDecimal(valor_inicial);
    const parcelamento = periodo;
    const total = twoDecimal(capital * Math.pow(1 + I, periodo));
    const valor_parcela = twoDecimal(total / parcelamento);
    const total_juros = twoDecimal(total - capital);
    const juros_parcelas = [];

    for (let i = 1; i < periodo + 1; i++) {
      juros_parcelas.push(twoDecimal(capital * Math.pow(1 + I, i)));
    }

    return {
      capital,
      parcelamento,
      taxa_juros: I,
      total,
      valor_parcela,
      total_juros,
      juros_parcelas,
    };
  } else {
    const capital = valor_inicial;
    const total = twoDecimal(capital);
    const valor_parcela = twoDecimal(capital);
    const total_juros = twoDecimal(total - capital);

    return {
      capital,
      total,
      valor_parcela,
      total_juros,
    };
  }
}
