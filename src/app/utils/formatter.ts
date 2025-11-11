export const dataFormatter = new Intl.DateTimeFormat("pt-BR");
export const formatPrice = (price: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(isNaN(price) ? 0 : price);
};