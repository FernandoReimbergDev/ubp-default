import { Button } from "@/app/components/Button";
import { useAuth } from "@/app/Context/AuthContext";
import { yupResolver } from "@hookform/resolvers/yup";
import { ArrowRight, KeyRound, RectangleEllipsis } from "lucide-react";
import { SubmitHandler, useForm } from "react-hook-form";
import { InputField, InputIcon, InputRoot } from "../../../components/Input";
import { passwordSchema, type PasswordForm } from "./schemas";

export function PasswordForm() {
  const { setNewPassword } = useAuth();
  const {
    register,
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
  } = useForm<PasswordForm>({
    resolver: yupResolver(passwordSchema),
  });
  async function handlePasswordSubmit(data: PasswordForm) {
    const result = await setNewPassword(data.password || "", data.confirmPassword || "");

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
