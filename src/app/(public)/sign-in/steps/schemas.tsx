// schemas.ts
import { object, string, ref, InferType } from "yup";

export const userName = object({
  userName: string().min(2, "digite um nome de usuario valido").required("Nome de usuario obrigatorio"),
});
export type userNameForm = InferType<typeof userName>;

export const codeSchema = object({
  accessCode: string().required("Código obrigatório"),
});

export type CodeForm = InferType<typeof codeSchema>;

export const loginSchema = object({
  userName: string().min(2, "digite um nome de usuario valido").required("Nome de usuario obrigatorio"),
  password: string().required("Senha obrigatória"),
});
export type LoginForm = InferType<typeof loginSchema>;

export const emailSchema = object({
  email: string().email("Digite um e-mail válido").required("O e-mail é obrigatório"),
});
export type emailForm = InferType<typeof emailSchema>;

export const passwordSchema = object({
  email: string().email("Digite um e-mail válido").required("O e-mail é obrigatório"),
  accessCode: string().required("Código obrigatório"),
  password: string().required("Senha obrigatória"),
  confirmPassword: string()
    .oneOf([ref("password")], "As senhas devem ser iguais")
    .required("Confirmação obrigatória"),
});
export type PasswordForm = InferType<typeof passwordSchema>;

export const resetSchema = object({
  email: string().email("Digite um e-mail válido").required("O e-mail é obrigatório"),
  resetCodeInput: string().required("Código obrigatório"),
  password: string().required("Senha obrigatória"),
  confirmPassword: string()
    .oneOf([ref("password")], "As senhas devem ser iguais")
    .required("Confirmação obrigatória"),
});
export type ResetForm = InferType<typeof resetSchema>;
