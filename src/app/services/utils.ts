import { HandleMaskParams } from "../types/responseTypes";

// Função para validar se um CPF é válido
export const isValidCPF = (cpf: string): boolean => {
  cpf = cpf.replace(/[^\d]/g, ""); // Remove caracteres não numéricos

  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false; // Rejeita valores repetidos como 111.111.111-11

  let sum = 0;
  let rest;

  // Valida o primeiro dígito verificador
  for (let i = 1; i <= 9; i++) sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cpf.substring(9, 10))) return false;

  sum = 0;
  // Valida o segundo dígito verificador
  for (let i = 1; i <= 10; i++) sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;

  return rest === parseInt(cpf.substring(10, 11));
};

// Função para validar se um CNPJ é válido
export const isValidCNPJ = (cnpj: string): boolean => {
  cnpj = cnpj.replace(/[^\d]/g, ""); // Remove caracteres não numéricos

  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false; // Rejeita valores repetidos como 11.111.111/1111-11

  let size = 12;
  let numbers = cnpj.substring(0, size);
  const digits = cnpj.substring(size);
  let sum = 0;
  let pos = size - 7;

  // Calcula o primeiro dígito verificador
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  size = size + 1;
  numbers = cnpj.substring(0, size);
  sum = 0;
  pos = size - 7;

  // Calcula o segundo dígito verificador
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);

  return result === parseInt(digits.charAt(1));
};

// Função principal para validar CPF ou CNPJ
export const validateCPFOrCNPJ = (document: string): boolean => {
  if (!document) return false;

  document = document.replace(/[^\d]/g, "");

  if (document.length === 11) return isValidCPF(document);
  if (document.length === 14) return isValidCNPJ(document);

  return false;
};

export function removeHtmlTags(input: string | null | undefined): string {
  if (!input) {
    return "";
  }
  return input.replace(/<\/?[^>]+(>|$)/g, "");
}

export const handleCEPMask: HandleMaskParams = (value, setValue, trigger, setError, clearErrors) => {
  const maskedValue = value
    .replace(/\D/g, "")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{3})\d+?$/, "$1");

  setValue("cep", maskedValue, { shouldValidate: true });

  if (!/^\d{5}-\d{3}$/.test(maskedValue)) {
    setError("cep", {
      type: "manual",
      message: "CEP inválido. Use o formato 00000-000.",
    });
  } else {
    clearErrors("cep");
  }

  trigger("cep");
};

export const handleCnpjCpfMask: HandleMaskParams = async (
  value,
  setValue,
  trigger,
  setError,
  clearErrors,
  fieldName: string = "cnpj_cpf"
) => {
  const numericValue = value.replace(/\D/g, "");
  let maskedValue = numericValue;

  if (numericValue.length <= 11) {
    // CPF
    maskedValue = numericValue
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  } else {
    // CNPJ
    maskedValue = numericValue
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  }
  setValue(fieldName as any, maskedValue); // formata primeiro

  // Aguarda o trigger para revalidar
  trigger(fieldName as any).then(() => {
    const isValid = validateCPFOrCNPJ(numericValue);
    if (!isValid) {
      setError(fieldName as any, { type: "manual", message: "CNPJ ou CPF inválido." });
    } else {
      clearErrors(fieldName as any);
    }
  });
};

export const handlePhoneMask: HandleMaskParams = (value, setValue, trigger, setError, clearErrors) => {
  const numericValue = value.replace(/\D/g, "");
  let maskedValue = numericValue;

  if (numericValue.length > 8 && numericValue.length <= 10) {
    maskedValue = numericValue.replace(/(\d{5})(\d)/, "$1-$2");
  }

  if (numericValue.length === 8 && numericValue.length <= 10) {
    maskedValue = numericValue.replace(/(\d{4})(\d)/, "$1-$2");
  }
  if (numericValue.length > 10) {
    maskedValue = numericValue.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
  }

  setValue("telefone", maskedValue, { shouldValidate: true });

  if (numericValue.length < 10 || numericValue.length > 11) {
    setError("telefone", {
      type: "manual",
      message: "Número de telefone inválido.",
    });
  } else {
    clearErrors("telefone");
  }

  trigger("telefone");
};

export const fetchAddressFromCep: HandleMaskParams = async (value, setValue, trigger, setError, clearErrors) => {
  if (!/^\d{5}-\d{3}$/.test(value)) {
    setError("cep", {
      type: "manual",
      message: "CEP inválido. Use o formato 00000-000.",
    });
    return;
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${value}/json/`);
    if (!response.ok) {
      throw new Error("Erro ao consultar o CEP");
    }

    const data = await response.json();

    if (data.erro) {
      setError("cep", {
        type: "manual",
        message: "CEP não encontrado.",
      });
      return;
    }

    clearErrors("cep");

    setValue("logradouro", data.logradouro || "");
    setValue("bairro", data.bairro || "");
    setValue("municipio", data.localidade || "");
    setValue("uf", data.uf || "");
    setValue("ibge", data.ibge || "");
    setValue("ddd", data.ddd || "");

    trigger("logradouro");
    trigger("bairro");
    trigger("municipio");
    trigger("uf");
    trigger("ibge");
    trigger("ddd");
  } catch {
    setError("cep", {
      type: "manual",
      message: "Erro ao buscar o CEP.",
    });
  }
};

export function maskEmail(email: string): string {
  if (!email) return "";
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  const maskedUser =
    user.length <= 2 ? user[0] + "*".repeat(user.length - 1) : user.slice(0, 2) + "*".repeat(user.length - 2);
  const [dom, ...rest] = domain.split(".");
  const maskedDom =
    dom.length <= 2 ? dom[0] + "*".repeat(dom.length - 1) : dom.slice(0, 2) + "*".repeat(dom.length - 2);
  return `${maskedUser}@${maskedDom}.${rest.join(".")}`;
}

// Função para validar número do cartão usando algoritmo de Luhn
export const isValidCardNumber = (cardNumber: string): boolean => {
  const numericValue = cardNumber.replace(/\D/g, "");

  if (numericValue.length < 13 || numericValue.length > 19) return false;

  let sum = 0;
  let isEven = false;

  // Percorre os dígitos de trás para frente
  for (let i = numericValue.length - 1; i >= 0; i--) {
    let digit = parseInt(numericValue[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

// Função para identificar a bandeira do cartão
export const getCardBrand = (cardNumber: string): string => {
  const numericValue = cardNumber.replace(/\D/g, "");

  // Visa: começa com 4
  if (/^4/.test(numericValue)) {
    return "Visa";
  }

  // Mastercard: começa com 5[1-5] ou 2[2-7]
  if (/^5[1-5]/.test(numericValue) || /^2[2-7]/.test(numericValue)) {
    return "Mastercard";
  }

  // American Express: começa com 34 ou 37
  if (/^3[47]/.test(numericValue)) {
    return "Amex";
  }

  // Elo: começa com 4011, 4312, 4389, 4514, 4573, 5041, 5066, 5067, 5090, 6277, 6362, 6363, 6504, 6505, 6506, 6507, 6508, 6509, 6516, 6550, 4011, 4312, 4389, 4514, 4573, 5041, 5066, 5067, 5090, 6277, 6362, 6363, 6504, 6505, 6506, 6507, 6508, 6509, 6516, 6550
  if (
    /^(4011|4312|4389|4514|4573|5041|5066|5067|5090|6277|6362|6363|6504|6505|6506|6507|6508|6509|6516|6550)/.test(
      numericValue
    )
  ) {
    return "Elo";
  }

  // Hipercard: começa com 38, 60, 65
  if (/^(38|60|65)/.test(numericValue)) {
    return "Hipercard";
  }

  // Diners: começa com 30, 36, 38
  if (/^3[068]/.test(numericValue)) {
    return "Diners";
  }

  // Discover: começa com 6011, 622, 644, 645, 646, 647, 648, 649, 65
  if (/^(6011|622|644|645|646|647|648|649|65)/.test(numericValue)) {
    return "Discover";
  }

  return "desconhecido";
};

// Função para formatar número do cartão
export const formatCardNumber = (value: string): string => {
  const numericValue = value.replace(/\D/g, "");

  // Limita a 19 dígitos (máximo para cartões)
  const limitedValue = numericValue.slice(0, 19);

  // Formata com espaços a cada 4 dígitos
  return limitedValue.replace(/(\d{4})(?=\d)/g, "$1 ");
};

// Função principal para máscara de cartão
export const handleMaskCard = async (
  value: string,
  setValue: any,
  trigger: any,
  setError: any,
  clearErrors: any,
  fieldName: string = "numero_cartao"
) => {
  const numericValue = value.replace(/\D/g, "");
  const formattedValue = formatCardNumber(numericValue);

  // Atualiza o valor formatado
  setValue(fieldName, formattedValue);

  // Valida o número do cartão
  const isValid = isValidCardNumber(numericValue);
  const brand = getCardBrand(numericValue);

  // Trigger para revalidar
  await trigger(fieldName);

  if (numericValue.length < 13) {
    setError(fieldName, {
      type: "manual",
      message: "Número do cartão muito curto.",
    });
  } else if (numericValue.length > 19) {
    setError(fieldName, {
      type: "manual",
      message: "Número do cartão muito longo.",
    });
  } else if (!isValid) {
    setError(fieldName, {
      type: "manual",
      message: "Número do cartão inválido.",
    });
  } else {
    clearErrors(fieldName);
  }

  // Retorna informações sobre o cartão
  return { brand, isValid, formattedValue };
};
