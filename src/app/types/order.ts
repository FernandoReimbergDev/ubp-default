export type OrderBuyer = {
  fullName: string;
  email: string;
  phone: string;
  key: string;
  document?: string; // CPF/CNPJ
};

export type Address = {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string; // UF
  zipCode: string; // CEP
};

export type OrderBilling = {
  companyName: string;
  cnpj: string;
  stateRegistration?: string; // IE
  municipalRegistration?: string; // IM
  taxRegime?: string; // Simples, Lucro Presumido, etc.
  address: Address;
};

export type OrderDelivery = {
  recipientName: string;
  contactName?: string;
  contactPhone?: string;
  address: Address;
  method?: string; // SEDEX, PAC, Retirada, etc.
  trackingCode?: string; // código de rastreio
};

export type OrderPayment = {
  method: "Boleto" | "Cartao" | "Pix" | "Transferencia" | string;
  totalAmount: number;
  installments?: number;
  interestRate?: number; // percentual
  interestAmount?: number; // valor absoluto
  status?: string; // Aprovado, Pendente, etc.
};

export type OrderProduct = {
  code: string;
  name?: string;
  imageUrl?: string;
  unitPrice: number;
  quantity: number;
  total: number;
};

export type OrderDetails = {
  numero: string;
  status?: string; // Status geral do pedido
  solicitante: OrderBuyer;
  faturarPara: OrderBilling;
  entrega: OrderDelivery;
  pagamento: OrderPayment;
  produtos: OrderProduct[];
  totais?: {
    produtos?: number;
    frete?: number;
    juros?: number;
    pedido?: number;
  };
  compra?: string; // data
  previsaoEntrega?: string; // data
};