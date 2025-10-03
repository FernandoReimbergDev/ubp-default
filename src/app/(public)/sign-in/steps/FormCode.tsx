import { Button } from "@/app/components/Button";
import { useAuth } from "@/app/Context/AuthContext";
import { yupResolver } from "@hookform/resolvers/yup";
import { ArrowRight, Lock, MailCheck } from "lucide-react";
import { SubmitHandler, useForm } from "react-hook-form";
import { InputField, InputIcon, InputRoot } from "../../../components/Input";
import { codeSchema, type CodeForm } from "../steps/schemas";
import { maskEmail } from "@/app/services/utils";
import { useState } from "react";

export function CodeForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { verifyCode, requestCodePassword, email } = useAuth();
  const {
    register,
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
  } = useForm<CodeForm>({
    resolver: yupResolver(codeSchema),
  });

  async function handleCodeSubmit(data: CodeForm) {
    const result = await verifyCode(email, data.accessCode || "");

    if (!result.success) {
      setError("accessCode", {
        type: "manual",
        message: "Código inválido",
      });

      return;
    }
  }

  async function handleResendCode() {
    setIsLoading(true);
    const result = await requestCodePassword(email);
  }

  const onSubmit: SubmitHandler<CodeForm> = async (data) => {
    await handleCodeSubmit(data);
  };

  return (
    <>
      <form className="space-y-4 w-full overflow-hidden" autoComplete="on" onSubmit={handleSubmit(onSubmit)}>
        <h2 className="font-Poppins font-semibold text-slate-600 text-2xl flex items-center gap-2">Entrar</h2>
        <p className="text-base text-gray-700 flex flex-col items-start gap-2">
          <MailCheck size={28} /> Enviamos um código para o e-mail: {maskEmail(email)}
          <span className="text-xs text-gray-500">o codigo é valido por 5 minutos</span>
        </p>

        <InputRoot data-error={!!errors.accessCode}>
          <InputIcon>
            <Lock className={errors.accessCode ? "text-red-500" : ""} />
          </InputIcon>
          <InputField {...register("accessCode")} type="text" placeholder="Código de verificação" />
        </InputRoot>

        <Button disabled={isSubmitting} type="submit">
          Continuar <ArrowRight />
        </Button>
        <div className="h-6 ">{isSubmitting && <span className="loader"></span>}</div>
      </form>
      <button
        type="button"
        className="text-blue-700 text-sm hover:underline text-right w-full pr-2 cursor-pointer"
        onClick={handleResendCode}
        disabled={isLoading}
      >
        Reenviar código?
      </button>

      {errors.accessCode && <p className="text-red-500 text-xs font-semibold">{errors.accessCode.message}</p>}
    </>
  );
}
