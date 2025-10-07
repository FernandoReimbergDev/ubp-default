import { removeHtmlTags, validateCPFOrCNPJ } from "@/app/services/utils";
import * as yup from "yup";
import type { Asserts } from "yup";

export const groupUserOptions = [
  "administrador",
  "administrador conteudo",
  "cliente",
  "funcionario",
  "representante",
] as const;

export const MeusDadosSchema = yup.object({
  login: yup
    .string()
    .min(3, "Login deve ter no mínimo 3 caracteres")
    .max(60, "Login não deve ter mais de 60 caracteres")
    .required("Login é obrigatóriO")
    .transform(removeHtmlTags),

  fullName: yup
    .string()
    .min(3, "Nome completo deve ter no mínimo 3 caracteres")
    .max(60, "Nome não deve ter mais de 60 caracteres")
    .required("Nome completo é obrigatóriO")
    .transform(removeHtmlTags),

  email: yup
    .string()
    .email("E-mail inválido")
    .max(256, "E-mail não deve ter mais de 256 caracteres")
    .required("E-mail é obrigatório"),

  ddd: yup
    .string()
    .length(2, "DDD deve ter exatamente 2 caracteres")
    .required("DDD é obrigatório")
    .transform(removeHtmlTags),

  telefone: yup
    .string()
    .min(8, "Telefone deve ter no mínimo 8 caracteres")
    .max(15, "Telefone não deve ter mais do que 15 caracteres")
    .required("Telefone é obrigatório"),

  celular: yup
    .string()
    .min(8, "Telefone deve ter no mínimo 8 caracteres")
    .max(15, "Telefone não deve ter mais do que 15 caracteres")
    .required("Celular é obrigatório"),

  entityType: yup.string().required("É obrigatorio selecionar uma das opções pessoa física ou jurídica"),

  cnpj_cpf: yup
    .string()
    .required("CNPJ ou CPF é obrigatório")
    .test("is-cnpj-cpf", "CNPJ ou CPF inválido", (value) => (value ? validateCPFOrCNPJ(value) : false)),

  group_user: yup
    .string()
    .transform((v) => (v === "" ? undefined : v))
    .oneOf(groupUserOptions as unknown as string[], "Grupo de usuário inválido")
    .required("Selecione um grupo de usuário"),

  cep: yup
    .string()
    .required("CEP é obrigatório")
    .max(10, "CEP não pode ter mais que 10 caracteres")
    .matches(/^\d{5}-\d{3}$/, "CEP inválido. O formato deve ser 00000-000"),

  logradouro: yup
    .string()
    .min(2, "Endereço deve ter no mínimo 2 caracteres")
    .max(50, "logradouro não pode ter mais que 50 caracteres")
    .required("Logradouro é obrigatório")
    .transform(removeHtmlTags),

  numero: yup
    .string()
    .min(1, "Número deve ter no mínimo 1 caractere")
    .max(20, "Número não pode ter mais que 50 caracteres")
    .required("Número é obrigatório")
    .transform(removeHtmlTags),

  complemento: yup
    .string()
    .max(50, "Complemento não deve ter mais do que 50 caracteres")
    .nullable()
    .default(null)
    .transform((value) => (value ? removeHtmlTags(value) : undefined)),

  bairro: yup
    .string()
    .min(3, "Bairro deve ter no mínimo 3 caracteres")
    .max(50, "Bairro não pode ter mais que 50 caracteres")
    .required("Bairro é obrigatório")
    .transform(removeHtmlTags),

  municipio: yup
    .string()
    .min(3, "Município deve ter no mínimo 3 caracteres")
    .max(50, "Município não pode ter mais que 50 caracteres")
    .required("Município é obrigatório")
    .transform(removeHtmlTags),

  uf: yup
    .string()
    .length(2, "UF deve ter exatamente 2 caracteres")
    .required("UF é obrigatória")
    .transform(removeHtmlTags),

  ibge: yup.string().nullable().default(null),

  razao_social: yup
    .string()
    .min(3, "Razão social ou nome deve ter no mínimo 3 caracteres")
    .required("Razão social é obrigatória")
    .transform(removeHtmlTags),

  franquia: yup.string().nullable().default(null).transform(removeHtmlTags),

  inscricao_estadual: yup
    .string()
    .nullable()
    .default(null)
    .transform((value) => (value ? removeHtmlTags(value) : undefined)),

  inscricao_municipal: yup
    .string()
    .nullable()
    .default(null)
    .transform((value) => (value ? removeHtmlTags(value) : undefined)),
});

export type MeusDadosFormData = Asserts<typeof MeusDadosSchema>;
