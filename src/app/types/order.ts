//solicitante / usuario que fez o pedido
export type OrderBuyer = {
  entityType: string;
  legalName: string;//nome completo ou razao social
  email: string;
  areaCode: string; // Código de área do telefone
  phone: string;
  key: string;
  cpfCnpj: string; // CPF/CNPJ
  ie?: string; // IE
};

export type Address = {
  name: string;
  number: string;
  line2?: string;//complemento
  neighborhood: string;//rua XXX
  city: string;
  stateCode: string; // UF
  zipCode: string; // CEP
  ibgeCode?: string; // Código IBGE da cidade
};

export type OrderBilling = {
  legalName: string;
  cpfCnpj: string;
  ie?: string; // IE
  im?: string; // IM
  entityType: string;
  contactName: string;
  contactEmail: string;
  contactPhoneAreaCode?: string; // Código de área do telefone
  contactPhone?: string;
  address: Address;
  status?: string; // Status da emissão da nota fiscal
};

export type OrderDelivery = {
  legalName: string;
  cpfCnpf: string;
  ie?: string; // IE
  im?: string; // IM
  entityType: string;
  contactName: string;
  contactEmail?: string;
  contactPhoneAreaCode?: string; // Código de área do telefone
  contactPhone?: string;
  address: Address;
  status?: string;//status da entrega
  method?: string; // SEDEX, PAC, Retirada, etc.
  trackingCode?: string; // código de rastreio

};

export type OrderPayment = {
  method: "Boleto" | "Cartao" | "Pix" | "Transferencia" | string;
  dueDate?: string; // data de vencimento
  paymentDate?: string; // data de pagamento
  expirationDate?: string; // data de expiração do pagamento
  totalAmount: number;
  installments?: number;
  interestRate?: number; // percentual
  interestAmount?: number; // valor absoluto
  status?: string; // Aprovado, Pendente, etc.
  //campos para informações do boleto
  boleto?: {
    number: string;
    dueDate: string;
    url: string;
  };
  //campos para informações do pix
  pix?: {
    key: string;
    url: string;
  };
  //campos para informações da transferência
  transferencia?: {
    bank: string;
    agency: string;
    account: string;
    name: string;
  };
  //campos para informações do cartão
  cartao?: {
    name: string;//nome do cartão
    brand: string;//marca do cartão
    number: string;//numero do cartão
    taxValue?: number;//valor que foi cobrado de taxas
    taxPercent?: number;//percentual de taxas
  };
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
  orderId: string;
  storeId: string;
  sellerId: string;//id do vendedor
  sellerName: string;//nome do vendedor
  // status?: string;//Status geral do pedido
  orderStatus?: string;//Status do pedido
  buyer: OrderBuyer;//informações do solicitante / usuario que fez o pedido
  billing: OrderBilling;//informações do pagador / usuário que pagará o pedido
  delivery: OrderDelivery;//informações do destinatário / usuário que receberá o pedido
  payment: OrderPayment;//informações do pagamento
  products: OrderProduct[];
  totalProductsAmount: number;//total de produtos
  totalDiscountAmount: number;//total de descontos
  totalShippingAmount: number;//total de frete
  totalInterestAmount: number;//total de juros
  orderTotalAmount: number;//total do pedido
  // purchaseDate: string;//data da compra
  expectedDeliveryDate?: string;//data prevista de entrega
  deliveredDate?: string;//data de entrega      
  paymentDate?: string;//data de pagamento
  createdAt?: string;//data de criação
  updatedAt?: string;//data de atualização
};