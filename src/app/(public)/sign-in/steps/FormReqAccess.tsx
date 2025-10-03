import { Button } from "@/app/components/Button";
import { yupResolver } from "@hookform/resolvers/yup";
import { ArrowRight, UserRound } from "lucide-react";
import { SubmitHandler, useForm } from "react-hook-form";
import { InputField, InputIcon, InputRoot } from "../../../components/Input";
import { useAuth } from "../../../Context/AuthContext";
import { userNameForm, userName } from "./schemas";

export function ReqAccessForm() {
  const { requestAccess } = useAuth();
  const {
    register,
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
  } = useForm<userNameForm>({
    resolver: yupResolver(userName),
  });

  async function handleReqAccess(data: userNameForm) {
    const result = await requestAccess(data.userName);

    if (!result.success) {
      setError("userName", {
        type: "manual",
        message: result.message || "E-mail inválido ou não cadastrado.",
      });
      return;
    }

    return data.userName;
  }

  const onSubmit: SubmitHandler<userNameForm> = async (data) => {
    await handleReqAccess(data);
  };

  return (
    <>
      <form className="space-y-4 w-full overflow-hidden" autoComplete="on" onSubmit={handleSubmit(onSubmit)}>
        <h2 className="font-Poppins font-semibold text-slate-600 text-2xl flex items-center gap-2">Entrar</h2>
        <p className="font-montserrat">Digite seu nome de usuário cadastrado</p>
        <InputRoot data-error={!!errors.userName}>
          <InputIcon>
            <UserRound className={errors.userName ? "text-red-500" : ""} />
          </InputIcon>
          <InputField {...register("userName")} type="text" placeholder="Nome de usuario" />
        </InputRoot>
        {errors.userName && <p className="text-red-500 text-xs font-semibold">{errors.userName.message}</p>}
        <Button disabled={isSubmitting} type="submit">
          Continuar <ArrowRight />
        </Button>
        <div className="h-6 ">{isSubmitting && <span className="loader"></span>}</div>
      </form>
    </>
  );
}
