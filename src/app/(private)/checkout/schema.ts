import { removeHtmlTags, validateCPFOrCNPJ, isValidCardNumber } from "@/app/services/utils";
import * as yup from "yup";
import type { Asserts } from "yup";

export const DadosPagamentoSchema = yup.object({
  card_number: yup
    .string()
    .required("Número do cartão é obrigatório")
    .test("is-valid-card", "Número do cartão inválido", (value) => (value ? isValidCardNumber(value) : false)),

  expiry_date: yup
    .string()
    .required("Data de expiração é obrigatorio")
    .matches(/^\d{2}\/\d{2}$/, "Data inválida. O formato deve ser mm/aa"),

  cvc_number: yup
    .string()
    .matches(/^\d+$/, "CVC deve conter apenas números")
    .length(3, "CVC deve ter exatamente 3 dígitos")
    .required("CVC é obrigatório"),

  cardholder_name: yup
    .string()
    .min(3, "Nome do titular deve ter no mínimo 3 caracteres")
    .required("Nome do titular é obrigatória")
    .transform(removeHtmlTags),
});

export type DadosEntregaFormData = Asserts<typeof DadosPagamentoSchema>;
