import { Button } from "@/app/components/Button";
import { yupResolver } from "@hookform/resolvers/yup";
import { ArrowRight, KeyRound, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { InputField, InputIcon, InputRoot } from "../../../components/Input";
import { useAuth } from "../../../Context/AuthContext";
import type { LoginForm } from "./schemas";
import { loginSchema } from "./schemas";
import { AuthButtons } from "@/app/components/AuthButtons";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, requestCodePassword, userName, setStep } = useAuth();
  const sso_enabled = false;

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<LoginForm>({
    resolver: yupResolver(loginSchema),
  });

  useEffect(() => {
    if (userName) {
      setValue("userName", userName);
    }
  }, [userName, setValue]);

  async function handleLogin(data: LoginForm) {
    const success = await signIn({ userName: data.userName, password: data.password || "" });

    if (!success) {
      setError("password", {
        type: "manual",
        message: "Username ou Senha inválido",
      });
    }
  }

  const onSubmit: SubmitHandler<LoginForm> = async (data) => {
    await handleLogin(data);
  };

  async function handleForgotPassword(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsLoading(true);
    await requestCodePassword();
    setIsLoading(false);
    setStep("code");

  }

  return (
    <>
      <form className="space-y-4 w-full overflow-hidden" autoComplete="on" onSubmit={handleSubmit(onSubmit)}>
        <h2 className="font-Poppins font-semibold text-slate-600 text-2xl flex items-center gap-2">Entrar</h2>
        <p className="font-montserrat">Digite seu nome de usuário e senha</p>
        <InputRoot data-error={!!errors.userName || !!errors.password}>
          <InputIcon>
            <UserRound className={errors.userName || errors.password ? "text-red-500" : ""} />
          </InputIcon>
          <InputField {...register("userName")} type="text" placeholder="Digite seu nome de usuario" />
        </InputRoot>
        {errors.userName && <p className="text-red-500 text-xs font-semibold">{errors.userName.message}</p>}

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
        {sso_enabled && <AuthButtons />}

        <div className="h-6 ">{isSubmitting || isLoading && <span className="loader"></span>}</div>
      </form>
      <button
        type="button"
        className="text-blue-700 text-sm hover:underline text-right w-full pr-2 cursor-pointer"
        onClick={handleForgotPassword}
        disabled={isLoading}
      >
        Esqueceu a senha?
      </button>
    </>
  );
}
