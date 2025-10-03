import { Button } from "@/app/components/Button";
import { useAuth } from "@/app/Context/AuthContext";
import { yupResolver } from "@hookform/resolvers/yup";
import { ArrowRight, KeyRound, Lock, Mail, RectangleEllipsis } from "lucide-react";
import { useEffect } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { InputField, InputIcon, InputRoot } from "../../../components/Input";
import { ResetForm, resetSchema } from "./schemas";

export function ResetPasswordForm() {
  const { email, code } = useAuth();

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<ResetForm>({
    resolver: yupResolver(resetSchema),
  });

  useEffect(() => {
    if (email) {
      setValue("email", email);
      setValue("resetCodeInput", code);
    }
  }, [email, code, setValue]);

  async function handleResetPassword(data: ResetForm) {
    const response = await fetch("/api/list-user", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    console.log(data);
    const resData = await response.json();

    if (!response.ok || !resData.success) {
      setError("password", {
        type: "manual",
        message: resData.message || "Senha fraca ou não coincidem ",
      });
      return;
    }
    window.location.href = "/";
  }

  const onSubmit: SubmitHandler<ResetForm> = async (data) => {
    await handleResetPassword(data);
  };
  return (
    <>
      <form className="space-y-4 w-full overflow-hidden" autoComplete="on" onSubmit={handleSubmit(onSubmit)}>
        <h2 className="font-Poppins font-semibold text-slate-600 text-2xl flex items-center gap-2">Entrar</h2>
        <p className="font-montserrat">Código validado, cadastre sua nova senha</p>

        <InputRoot data-error={!!errors.email} hidden>
          <InputIcon>
            <Mail className={errors.email ? "text-red-500" : ""} />
          </InputIcon>
          <InputField {...register("email")} type="email" placeholder="E-mail" readOnly />
        </InputRoot>
        {errors.email && <p className="text-red-500 text-xs font-semibold">{errors.email.message}</p>}

        {/* Código enviado por e-mail */}
        <InputRoot data-error={!!errors.resetCodeInput} hidden>
          <InputIcon>
            <Lock className={errors.resetCodeInput ? "text-red-500" : ""} />
          </InputIcon>
          <InputField
            {...register("resetCodeInput")}
            type="text"
            placeholder="Digite o código recebido"
            maxLength={6}
            readOnly
          />
        </InputRoot>

        {/* Nova Senha */}
        <InputRoot data-error={!!errors.password}>
          <InputIcon>
            <KeyRound className={errors.password ? "text-red-500" : ""} />
          </InputIcon>
          <InputField {...register("password")} type="password" placeholder="Nova senha" autoComplete="false" />
        </InputRoot>
        {errors.password && <p className="text-red-500 text-xs font-semibold">{errors.password.message}</p>}

        {/* Confirmar Senha */}
        <InputRoot data-error={!!errors.confirmPassword}>
          <InputIcon>
            <RectangleEllipsis className={errors.confirmPassword ? "text-red-500" : ""} />
          </InputIcon>
          <InputField
            {...register("confirmPassword")}
            type="password"
            placeholder="Confirmar senha"
            autoComplete="false"
          />
        </InputRoot>
        {errors.confirmPassword && (
          <p className="text-red-500 text-xs font-semibold">{errors.confirmPassword.message}</p>
        )}

        <Button disabled={isSubmitting} type="submit">
          Continuar <ArrowRight />
        </Button>
        <div className="h-6 ">{isSubmitting && <span className="loader"></span>}</div>
      </form>
    </>
  );
}
