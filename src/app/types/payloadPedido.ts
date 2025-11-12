export type Phone = { areaCode?: string; number?: string };
export type Address = {
  entityTypeShipping: string;
  legalNameShipping: string;
  contactNameShipping: string;
  cpfCnpjShipping: string;
  ieShipping: string;
  emailShipping: string;
  areaCodeShipping: string;
  phoneShipping: string;
  addressIbgeCodeShipping: string;
  zipCodeShipping: string;
  streetNameShipping: string;
  streetNumberShipping: string;
  addressLine2Shipping: string;
  addressNeighborhoodShipping: string;
  addressCityShipping: string;
  addressStateCodeShipping: string;
};

export type UserShape = {
  id?: string | number;
  userId?: string | number;
  entityType?: "PF" | "PJ" | string;
  legalName?: string;
  fullName?: string;
  cpf?: string;
  cnpj?: string;
  cpfCnpj?: string;
  ie?: string;
  email?: string;
  phone?: Phone;
  phones?: Phone[];
  address?: OrderPayload;
  addresses?: Address[];
};

export interface OrderPayload {
  // Basic info
  storeId: string;
  userId: number;

  // User info
  entityType: string;
  legalName: string;
  fullName: string;
  cpfCnpj: string;
  ie: string;
  email: string;
  areaCode: string;
  phone: string;

  // Billing info
  entityTypeBilling: string;
  legalNameBilling: string;
  contactNameBilling: string;
  cpfCnpjBilling: string;
  ieBilling: string;
  emailBilling: string;
  areaCodeBilling: string;
  phoneBilling: string;
  addressIbgeCodeBilling: string;
  zipCodeBilling: string;
  streetNameBilling: string;
  streetNumberBilling: string;
  addressLine2Billing: string;
  addressNeighborhoodBilling: string;
  addressCityBilling: string;
  addressStateCodeBilling: string;

  // Shipping info
  entityTypeShipping: string;
  legalNameShipping: string;
  contactNameShipping: string;
  cpfCnpjShipping: string;
  ieShipping: string;
  emailShipping: string;
  areaCodeShipping: string;
  phoneShipping: string;
  addressIbgeCodeShipping: string;
  zipCodeShipping: string;
  streetNameShipping: string;
  streetNumberShipping: string;
  addressLine2Shipping: string;
  addressNeighborhoodShipping: string;
  addressCityShipping: string;
  addressStateCodeShipping: string;

  // Order info
  paymentMethod: string;
  numberOfInstallments: string;
  totalProductsAmount: string;
  totalDiscountAmount: string;
  totalShippingAmount: string;
  totalInterestAmount: string;
  orderTotalAmount: string;
  totalTaxAmount: string;
  paymentStatus: string;
  orderStatus: string;
  expectedDeliveryDate: string;
  deliveryDate: string;
  paymentDate: string;
}
