export interface UsuarioResponse {
  success: boolean;
  message: string;
  result: Usuario[];
}

export interface Usuario {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  rg: string;
  cpf: string;
  cnpj: string;
  ie: string;
  legalName: string;
  tradeName: string;
  entityType: "PF" | "PJ";
  birthDate: string;
  gender: string;
  firstAccess: string;
  isActive: string;
  createdAt: string;
  updatedAt: string;
  phones: Telefone[];
  addresses: Endereco[];
  rules: Regra[];
}

export interface Telefone {
  id: string;
  countryCode: string;
  areaCode: string;
  number: string;
  extension: string;
  label: string;
  isWhatsapp: string;
  isActive: string;
  createdAt: string;
  updatedAt: string;
}

export interface Endereco {
  id: string;
  ibge: string;
  zipcode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  stateCode: string;
  label: string;
  createDate: string;
  updateDate: string;
}

export interface Regra {
  id: string;
  storeId: string;
  name: string;
  createDate: string;
  updateDate: string;
}
