import { Button } from "@/app/components/Button";
import { useAuth } from "@/app/Context/AuthContext";
import { yupResolver } from "@hookform/resolvers/yup";
import { ArrowRight, Eye, EyeOff, KeyRound, RectangleEllipsis } from "lucide-react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { InputField, InputIcon, InputRoot } from "../../../components/Input";
import { ResetForm, resetSchema } from "./schemas";
import { PasswordStrengthIndicator } from "@/app/components/PasswordStrengthIndicator";
import { PasswordRequirements } from "@/app/components/PasswordRequirements";
import { useMemo, useState, useEffect } from "react";

// Importação dinâmica do zxcvbn
interface ZxcvbnResult {
  score: 0 | 1 | 2 | 3 | 4;
  feedback: {
    warning: string;
    suggestions: string[];
  };
}

type ZxcvbnFunction = (password: string) => ZxcvbnResult;

export function ResetPasswordForm() {
  const { code, userName } = useAuth();
  const [zxcvbnFunction, setZxcvbnFunction] = useState<ZxcvbnFunction | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<ResetForm>({
    resolver: yupResolver(resetSchema),
  });

  const password = watch("password", "") || "";
  const confirmPassword = watch("confirmPassword", "") || "";

  // Carrega zxcvbn quando o componente monta
  useEffect(() => {
    const loadZxcvbn = async () => {
      try {
        const zxcvbnModule = await import("zxcvbn");
        // zxcvbn pode ser exportado como default ou named export
        let zxcvbnFn: ZxcvbnFunction | undefined;
        if (zxcvbnModule.default && typeof zxcvbnModule.default === "function") {
          zxcvbnFn = zxcvbnModule.default as ZxcvbnFunction;
        } else if (typeof zxcvbnModule === "function") {
          zxcvbnFn = zxcvbnModule as ZxcvbnFunction;
        }

        if (zxcvbnFn) {
          // Testa a função com uma senha de exemplo para garantir que funciona
          try {
            const testResult = zxcvbnFn("test");
            if (testResult && typeof testResult.score === "number") {
              // Armazena a função usando função updater do React
              setZxcvbnFunction(() => zxcvbnFn!);
            } else {
              console.error("zxcvbn retornou resultado inválido:", testResult);
            }
          } catch (testError) {
            console.error("Erro ao testar zxcvbn:", testError);
          }
        } else {
          console.error("zxcvbn não foi encontrado como função. Módulo:", Object.keys(zxcvbnModule));
        }
      } catch (error) {
        console.error("Erro ao carregar zxcvbn:", error);
      }
    };
    loadZxcvbn();
  }, []);

  // Calcula a força da senha usando zxcvbn
  const passwordStrength = useMemo(() => {
    if (!password) {
      return { score: 0, feedback: { warning: "", suggestions: [] } };
    }

    if (!zxcvbnFunction) {
      // Se zxcvbn ainda não carregou, retorna score 0
      return { score: 0, feedback: { warning: "", suggestions: [] } };
    }

    try {
      const result = zxcvbnFunction(password);
      // Garante que o score está no range correto (0-4)
      const score = Math.max(0, Math.min(4, result.score ?? 0)) as 0 | 1 | 2 | 3 | 4;
      return {
        score,
        feedback: result.feedback || { warning: "", suggestions: [] },
      };
    } catch (error) {
      console.error("Erro ao calcular força da senha:", error);
      return { score: 0, feedback: { warning: "", suggestions: [] } };
    }
  }, [password, zxcvbnFunction]);

  // Define os requisitos de senha
  const passwordRequirements = useMemo(() => {
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const hasStrongScore = passwordStrength.score >= 3;

    return [
      {
        label: "Mínimo de 8 caracteres",
        met: hasMinLength,
        test: (p: string) => p.length >= 8,
      },
      {
        label: "Pelo menos uma letra maiúscula",
        met: hasUpperCase,
        test: (p: string) => /[A-Z]/.test(p),
      },
      {
        label: "Pelo menos uma letra minúscula",
        met: hasLowerCase,
        test: (p: string) => /[a-z]/.test(p),
      },
      {
        label: "Pelo menos um número",
        met: hasNumber,
        test: (p: string) => /[0-9]/.test(p),
      },
      {
        label: "Pelo menos um caractere especial (!@#$%^&*...)",
        met: hasSpecialChar,
        test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p),
      },
      {
        label: "Força da senha: Forte ou superior (nível 3+)",
        met: hasStrongScore,
        test: (p: string) => {
          if (!zxcvbnFunction || !p) return false;
          try {
            const strength = zxcvbnFunction(p);
            return (strength.score ?? 0) >= 3;
          } catch {
            return false;
          }
        },
      },
    ];
  }, [password, passwordStrength.score, zxcvbnFunction]);

  // Verifica se todos os requisitos obrigatórios foram atendidos
  const isPasswordValid = useMemo(() => {
    if (!password || !confirmPassword) return false;

    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const passwordsMatch = password === confirmPassword;

    // Se zxcvbn carregou, também verifica o score
    const hasStrongScore = zxcvbnFunction ? passwordStrength.score >= 3 : true; // Se não carregou ainda, não bloqueia por score (mas ainda exige os outros requisitos)

    // Todos os requisitos básicos devem ser atendidos + score se zxcvbn carregou
    return (
      hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar && hasStrongScore && passwordsMatch
    );
  }, [password, confirmPassword, passwordStrength.score, zxcvbnFunction]);

  async function handleResetPassword(data: ResetForm) {
    // Validação já foi feita pelo isPasswordValid que desabilita o botão
    // Mas adicionamos validação extra como segurança
    if (!isPasswordValid) {
      setError("password", {
        type: "manual",
        message:
          "A senha precisa atender a todos os requisitos: mínimo 8 caracteres, letra maiúscula, letra minúscula, número, caractere especial e força nível 3+.",
      });
      return;
    }

    try {
      const response = await fetch("/api/auth/new-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userName,
          recoveryCode: code,
          password: data.password,
          confirmPassword: data.confirmPassword,
        }),
      });

      const resData = await response.json().catch(() => ({ success: false, message: "Resposta inválida do servidor" }));

      if (!response.ok || !resData.success) {
        setError("password", {
          type: "manual",
          message: resData.message || "Senha fraca ou não coincidem ",
        });
        return;
      }
      window.location.href = "/";
    } catch (err: unknown) {
      console.error(err);
      setError("password", {
        type: "manual",
        message: "Falha na comunicação com o servidor.",
      });
    }
  }

  const onSubmit: SubmitHandler<ResetForm> = async (data) => {
    await handleResetPassword(data);
  };
  return (
    <>
      <form className="space-y-4 w-full overflow-hidden" autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <h2 className="font-Poppins font-semibold text-slate-600 text-2xl flex items-center gap-2">Entrar</h2>
        <p className="font-montserrat">Código validado, cadastre sua nova senha</p>

        {/* Nova Senha */}
        <div className="space-y-2">
          <InputRoot data-error={!!errors.password} className="relative">
            <InputIcon>
              <KeyRound className={errors.password ? "text-red-500" : ""} />
            </InputIcon>
            <InputField
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Nova senha"
              autoComplete="new-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </InputRoot>
          {errors.password && <p className="text-red-500 text-xs font-semibold">{errors.password.message}</p>}

          {/* Indicador de força da senha */}
          {password && <PasswordStrengthIndicator password={password} score={passwordStrength.score} />}

          {/* Requisitos da senha */}
          <PasswordRequirements
            requirements={passwordRequirements.map((req) => ({
              label: req.label,
              met: req.met,
            }))}
          />
        </div>

        {/* Confirmar Senha */}
        <InputRoot data-error={!!errors.confirmPassword} className="relative">
          <InputIcon>
            <RectangleEllipsis className={errors.confirmPassword ? "text-red-500" : ""} />
          </InputIcon>
          <InputField
            {...register("confirmPassword")}
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirmar senha"
            autoComplete="new-password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </InputRoot>
        {errors.confirmPassword && (
          <p className="text-red-500 text-xs font-semibold">{errors.confirmPassword.message}</p>
        )}

        <Button disabled={isSubmitting || !isPasswordValid} type="submit">
          Continuar <ArrowRight />
        </Button>
        <div className="h-6 ">{isSubmitting && <span className="loader"></span>}</div>
      </form>
    </>
  );
}
