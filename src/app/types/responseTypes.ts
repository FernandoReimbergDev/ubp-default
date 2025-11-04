/* eslint-disable @typescript-eslint/no-explicit-any */
import { UseFormSetValue, UseFormTrigger, UseFormSetError, UseFormClearErrors, FieldValues } from "react-hook-form";

export interface PasswordRecoveryResponse {
  success: boolean;
  message: string;
  result: PasswordRecoveryResult;
}

export interface PasswordRecoveryResult {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  username: string;
  firstAccess: string; // ou boolean se for convertido
  isActive: string; // ou boolean se for convertido
  passwordRecoveryCode: string;
}

export interface ProdutosResponse {
  success: boolean;
  message: string;
  result: Produto[];
}

export type stock = {
  pedidoId: string;
  compraId: string;
  chavePlataforma: string;
  chavePro: string;
  codPro: string;
  descrProcor: string;
  descrProTamanho: string;
  quantidadeAnterior: string;
  valorUnitarioAnterior: string;
  valorTotalAnterior: string;
  quantidadeEntrada: string;
  valorUnitarioEntrada: string;
  valorTotalEntrada: string;
  quantidadeSaida: string;
  valorUnitarioSaida: string;
  valorTotalSaida: string;
  quantidadeSaldo: string;
  valorUnitarioSaldo: string;
  valorTotalSaldo: string;
  tipoMovimento: string;
  tipoOperacao: string;
  dataAtualizado: string;
  observacao: string;
  dataCadastrado: string;
};
export type Produto = {
  quantidadeEstoquePro: string;
  chavePro: string;
  codPro: string;
  descr: string;
  descr2: string;
  descrWeb: string;
  descrWeb2: string;
  descrCompilada: string;
  descCompilada2: string;
  landingPage: string;
  urlAmigavel: string;
  fatorFrete: string;
  associacaoMarca: string;
  associacaoMarcaRequerida: string;
  calculoFrete: string;
  estControl: string;
  eventoData: string;
  ordemExibicao: string;
  pesoMultiplo: string;
  peso: string;
  dataCadastrado: string;
  dataAtualizado: string;
  cores: CorProduto[];
  precos: PrecoProduto[];
  imagens: ImagemProduto[];
  quantidade: number;
};

export type CorProduto = {
  chaveProCor: string;
  chavePro: string;
  descrProCor: string;
  descrFacialProCor: string;
  disponivelProCor: string;
  dataCadastradoProCor: string;
  dataAtualizadoProCor: string;
  cadastradoProCor: string;
};

export type ImagemProduto = {
  chaveProImg: string;
  chavePro: string;
  chavePersonal: string;
  urlProImg: string;
  urlProImg40: string;
  urlProImg120: string;
  urlProImgCor: string;
  urlProImgSuper: string;
  tipoArqProImg: string;
  corProImg: string;
  homeProImg: string;
  padraoProImg: string;
  dataCadastradoProImg: string;
  dataAtualizadoProImg: string;
  cadastradoProImg: string;
};

export type PrecoProduto = {
  chaveProPrc: string;
  chavePro: string;
  qtdiProPrc: string;
  qtdfProPrc: string;
  vluProPrc: string;
  conciliadoProPrc: string;
  dataCadastradoProPrc: string;
  dataAtualizadoProPrc: string;
  cadastradoProPrc: string;
};

// Tipagens para consulta de estoque do produto
export interface ProdutoEstoqueItem {
  pedidoId: string;
  compraId: string;
  chavePlataforma: string;
  chavePro: string;
  codPro: string;
  descrProcor: string;
  descrProTamanho: string;
  quantidadeAnterior: string;
  valorUnitarioAnterior: string;
  valorTotalAnterior: string;
  quantidadeEntrada: string;
  valorUnitarioEntrada: string;
  valorTotalEntrada: string;
  quantidadeSaida: string;
  valorUnitarioSaida: string;
  valorTotalSaida: string;
  quantidadeSaldo: string;
  valorUnitarioSaldo: string;
  valorTotalSaldo: string;
  tipoMovimento: string;
  tipoOperacao: string;
  observacao: string;
  dataCadastrado: string;
  dataAtualizado: string;
}

export interface ProdutoEstoqueResponse {
  success: boolean;
  message: string;
  result: ProdutoEstoqueItem[];
}

export interface CardProdutoProps {
  srcFront: string;
  alt: string;
  nameProduct: string;
  priceProduct: number;
  btn: React.ReactNode;
  stock: string;
  estControl: string;
  promotion?: boolean;
  percent_discont?: number;
  click?: (event: React.MouseEvent<HTMLButtonElement | SVGSVGElement | HTMLDivElement, MouseEvent>) => void;
}

export type ProdutosGrid = {
  id: number;
  codePro: string;
  product: string;
  description: string;
  price: number;
  srcFrontImage: string;
  srcBackImage: string;
  images: string[];
  alt: string;
  colors: string[];
  sizes: string[];
  chavePro: string;
  bannerImg?: string[];
  quantidadeEstoquePro: string;
  estControl: string;
};

export type CartContextType = {
  cart: ProdutoCart[];
  initializeCart: () => void;
  addProduct: (product: ProdutoCart) => void;
  removeProduct: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  updateColorOrSize: (id: string, newColor?: string, newSize?: string) => void;
  openCart: boolean;
  setOpenCart: (openCart: boolean) => void;
  fetchProductFrete: (
    purchaseAmount: string,
    stateCode: string,
    city: string,
    zipCode: string,
    weight: string,
    height: string,
    width: string,
    length: string,
    signal?: AbortSignal
  ) => Promise<number | undefined>;
};

export interface ProductDataProps {
  price: number;
  srcFrontImage: string;
  alt: string;
  colors: string[];
  sizes: string[];
  product: string;
  description: string;
  codePro: string;
  chavePro: string;
  images: string[];
  promotion?: boolean;
  percent_discont?: number;
  estControl: string;
  quantidadeEstoquePro: string;
}

export interface ModalProps {
  ProductData: ProductDataProps;
  onClose: () => void;
}

export type PersonalizationMeta = {
  fileName: string;
  mimeType: string;
  size: number;
};

export type ProdutoCart = {
  id: string;
  codPro: string;
  chavePro: string;
  productName: string;
  description: string;
  price: number;
  quantity: string;
  subtotal: number;
  color: string;
  size?: string;
  images: string[];
  alt: string;
  cores: string[];
  tamanhos: string[];
  personalization?: PersonalizationMeta;
};

export type clienteDadosEntrega = {
  cep: string;
  previsao_entrega: string | null;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  municipio: string;
  uf: string;
  contato_entrega: string;
  email: string;
  cnpj_cpf: string;
  razao_social: string;
  inscricao_estadual: string | null;
  ddd: string;
  telefone: string;
  informacoes_complementares: string | null;
};

export type SetValueFn = (
  field: "cep" | "telefone" | "cnpj_cpf" | "logradouro" | "bairro" | "cidade" | "uf" | "ddd",
  value: string
) => void;
export type TriggerFn = (field: "cep" | "telefone" | "cnpj_cpf") => void;

export type HandleMaskParams<TFieldValues extends FieldValues = any> = (
  value: string,
  setValue: UseFormSetValue<TFieldValues>,
  trigger: UseFormTrigger<TFieldValues>,
  setError: UseFormSetError<TFieldValues>,
  clearErrors: UseFormClearErrors<TFieldValues>
) => void | Promise<void>;

export type User = {
  id: number;
  email: string;
};

export type AccessStatus = "can-login" | "code-sent" | "awaiting-password";

export type EnderecoContext = {
  zipcode: string | null;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string | null;
  stateCode: string | null;
  complement: string | null;
};

export type TelefoneContext = {
  number: string;
};

export type Address = {
  zipcode: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement: string;
};

export type UsuarioContext = {
  id: string | number;
  username: string | null;
  email: string | null;
  firstName: string | null;
  cpf: string;
  cnpj: string;
  ie: string | null;
  phones: TelefoneContext[] | null;
  addresses: Address[] | null;
  endereco: EnderecoContext;
};

export type AuthContextType = {
  cliente: UsuarioContext | null;
  roles: string[];
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  fetchUserData: () => Promise<boolean>; // NOVO
  step: string;
  setStep: React.Dispatch<React.SetStateAction<"username" | "signIn" | "code" | "password" | "resetPassword">>;
  email: string;
  userName: string;
  code: string;
  loading: boolean;
  signIn: (credentials: { userName: string; password: string }) => Promise<boolean>;
  signOut: () => Promise<void>;
  requestAccess: (userName: string) => Promise<{
    success: boolean;
    status?: AccessStatus;
    email?: string;
    message: string;
    err?: unknown;
  }>;
  verifyCode: (email: string, accessCode: string) => Promise<{ success: boolean; message?: string }>;
  setPassword: (
    // userName: string,
    // accessCode: string,
    password: string,
    confirmPassword: string
  ) => Promise<{ success: boolean; message?: string }>;
  setNewPassword: (
    password: string,
    confirmPassword: string
  ) => Promise<{ success: boolean; message?: string }>;
  requestCodePassword: () => Promise<{
    success: boolean;
    message: string;
    result?: {
      passwordRecoveryCode: string;
      fullName: string;
      email: string;
      username: string;
      id: string;
      firstAccess: string;
      isActive: string;
    };
  }>;
  setCliente: (cliente: UsuarioContext) => void;
};

export interface ProductsContextType {
  products: Produto[];
  loading: boolean;
  error: string | null;
  fetchProducts: (signal?: AbortSignal) => Promise<void>;
}

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

export interface ToastContextType {
  success: (message: string) => void;
  alert: (message: string) => void;
  danger: (message: string) => void;
  default: (message: string) => void;
}

export type ToastModel = "default" | "alert" | "danger" | "success";
