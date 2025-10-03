import { Button } from "@/app/components/Button";
import { useAuth } from "@/app/Context/AuthContext";
import { yupResolver } from "@hookform/resolvers/yup";
import { ArrowRight, KeyRound, Lock, Mail } from "lucide-react";
import { SubmitHandler, useForm } from "react-hook-form";
import { InputField, InputIcon, InputRoot } from "../../../components/Input";
import { passwordSchema, type PasswordForm } from "./schemas";

export function PasswordForm() {
  const { setPassword } = useAuth();
  const {
    register,
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
  } = useForm<PasswordForm>({
    resolver: yupResolver(passwordSchema),
  });
  async function handlePasswordSubmit(data: PasswordForm) {
    const result = await setPassword(data.email, data.accessCode, data.password || "", data.confirmPassword || "");

    if (!result.success) {
      setError("password", {
        type: "manual",
        message: result.message || "Erro ao cadastrar senha.",
      });
      return;
    }

    window.location.href = "/";
  }

  const onSubmit: SubmitHandler<PasswordForm> = async (data) => {
    await handlePasswordSubmit(data);
  };
  return (
    <>
      <form className="space-y-4 w-full overflow-hidden" autoComplete="on" onSubmit={handleSubmit(onSubmit)}>
        <h2 className="font-Poppins font-semibold text-slate-600 text-2xl flex items-center gap-2">Entrar</h2>
        <p className="font-montserrat">Cadastre sua Senha</p>

        <InputRoot data-error={!!errors.email}>
          <InputIcon>
            <Mail className={errors.email ? "text-red-500" : ""} />
          </InputIcon>
          <InputField {...register("email")} type="email" placeholder="E-mail" />
        </InputRoot>
        {errors.email && <p className="text-red-500 text-xs font-semibold">{errors.email.message}</p>}

        <InputRoot data-error={!!errors.accessCode}>
          <InputIcon>
            <Lock className={errors.accessCode ? "text-red-500" : ""} />
          </InputIcon>
          <InputField {...register("accessCode")} type="text" placeholder="Código de verificação" />
        </InputRoot>

        <InputRoot data-error={!!errors.email}>
          <InputIcon>
            <Mail className={errors.email ? "text-red-500" : ""} />
          </InputIcon>
          <InputField {...register("email")} type="email" placeholder="E-mail" />
        </InputRoot>
        {errors.email && <p className="text-red-500 text-xs font-semibold">{errors.email.message}</p>}

        {/* Senha */}
        <InputRoot data-error={!!errors.password}>
          <InputIcon>
            <KeyRound className={errors.password ? "text-red-500" : ""} />
          </InputIcon>
          <InputField {...register("password")} type="password" placeholder="Senha" />
        </InputRoot>
        {errors.password && <p className="text-red-500 text-xs font-semibold">{errors.password.message}</p>}

        <Button disabled={isSubmitting} type="submit">
          Continuar <ArrowRight />
        </Button>
        <div className="h-6 ">{isSubmitting && <span className="loader"></span>}</div>
      </form>
    </>
  );
}
