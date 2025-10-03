import { removeHtmlTags, validateCPFOrCNPJ } from "@/app/services/utils";
import * as yup from "yup";
import type { Asserts } from "yup";

export const MeusDadosSchema = yup.object({
  cep: yup
    .string()
    .required("CEP é obrigatório")
    .matches(/^\d{5}-\d{3}$/, "CEP inválido. O formato deve ser 00000-000"),

  fullName: yup
    .string()
    .min(3, "Nome completo deve ter no mínimo 3 caracteres")
    .required("Nome completo é obrigatóriO")
    .transform(removeHtmlTags),

  logradouro: yup
    .string()
    .min(2, "Endereço deve ter no mínimo 2 caracteres")
    .required("Logradouro é obrigatório")
    .transform(removeHtmlTags),

  numero: yup
    .string()
    .min(1, "Número deve ter no mínimo 1 caractere")
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
    .required("Bairro é obrigatório")
    .transform(removeHtmlTags),

  municipio: yup
    .string()
    .min(3, "Município deve ter no mínimo 3 caracteres")
    .required("Município é obrigatório")
    .transform(removeHtmlTags),

  uf: yup
    .string()
    .length(2, "UF deve ter exatamente 2 caracteres")
    .required("UF é obrigatória")
    .transform(removeHtmlTags),

  ibge: yup.string().nullable().default(null),

  contato_entrega: yup
    .string()
    .min(2, "Nome do contato deve ter no mínimo 2 caracteres")
    .required("Contato para entrega é obrigatório")
    .transform(removeHtmlTags),

  email: yup.string().email("E-mail inválido").required("E-mail é obrigatório"),

  entityType: yup.string().required("É obrigatorio selecionar uma das opções pessoa física ou jurídica"),

  cnpj_cpf: yup
    .string()
    .required("CNPJ ou CPF é obrigatório")
    .test("is-cnpj-cpf", "CNPJ ou CPF inválido", (value) => (value ? validateCPFOrCNPJ(value) : false)),

  razao_social: yup
    .string()
    .min(3, "Razão social ou nome deve ter no mínimo 3 caracteres")
    .required("Razão social é obrigatória")
    .transform(removeHtmlTags),

  inscricao_estadual: yup
    .string()
    .nullable()
    .default(null)
    .transform((value) => (value ? removeHtmlTags(value) : undefined)),

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

  informacoes_complementares: yup
    .string()
    .nullable()
    .default(null)
    .transform((value) => (value ? removeHtmlTags(value) : undefined)),
});

export type MeusDadosFormData = Asserts<typeof MeusDadosSchema>;
