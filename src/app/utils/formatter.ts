export const dataFormatter = new Intl.DateTimeFormat("pt-BR");
export const formatPrice = (price: number, withCurrency: boolean = true) => {
  const safe = isNaN(price) ? 0 : price;
  if (withCurrency) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(safe);
  }
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
};

export const formatDateTime = (value?: string | Date) => {
  if (!value) return "";
  let d: Date | null = null;
  if (value instanceof Date) {
    d = isNaN(value.getTime()) ? null : value;
  } else {
    const s = String(value).trim();
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)/);
    if (m) {
      const y = Number(m[1]);
      const mo = Number(m[2]) - 1;
      const da = Number(m[3]);
      const h = m[4] ? Number(m[4]) : 0;
      const mi = m[5] ? Number(m[5]) : 0;
      const se = m[6] ? Number(m[6]) : 0;
      d = new Date(y, mo, da, h, mi, se);
    } else {
      const parsed = new Date(s.includes(" ") && !s.includes("T") ? s.replace(" ", "T") : s);
      d = isNaN(parsed.getTime()) ? null : parsed;
    }
  }
  if (!d) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
};

export const formatCpfCnpj = (value?: string) => {
  if (!value) return "";
  const digits = String(value).replace(/\D/g, "");
  if (digits.length === 11) return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (digits.length === 14) return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return value;
};

export const formatPhoneBR = (value?: string) => {
  if (!value) return "";
  const digits = String(value).replace(/\D/g, "");
  if (digits.length === 8) return digits.replace(/(\d{4})(\d{4})/, "$1-$2");
  if (digits.length === 9) return digits.replace(/(\d)(\d{4})(\d{4})/, "$1 $2-$3");
  return value;
};