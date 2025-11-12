"use client";

interface PasswordStrengthIndicatorProps {
  password: string;
  score: number; // 0-4 do zxcvbn
}

export function PasswordStrengthIndicator({ password, score }: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const strengthLabels = ["Muito fraca", "Fraca", "Razoável", "Forte", "Muito forte"];
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];
  const textColors = ["text-red-600", "text-orange-600", "text-yellow-600", "text-blue-600", "text-green-600"];

  const currentStrength = strengthLabels[score];
  const currentColor = strengthColors[score];
  const currentTextColor = textColors[score];
  const percentage = ((score + 1) / 5) * 100;

  return (
    <div className="space-y-2">
      {/* Barra de força */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-sm font-semibold ${currentTextColor}`}>Força da senha: {currentStrength}</span>
          <span className="text-xs text-slate-500">{score}/4</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div className={`h-full transition-all duration-300 ${currentColor}`} style={{ width: `${percentage}%` }} />
        </div>
      </div>

      {/* Mensagem de nível mínimo */}
      {score < 3 && password.length > 0 && (
        <p className="text-xs text-orange-600 font-medium mt-2">
          ⚠️ A senha precisa atingir nível 3 (Forte) ou superior para ser aceita.
        </p>
      )}
    </div>
  );
}
