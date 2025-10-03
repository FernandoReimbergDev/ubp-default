"use client";
import { useEffect, useState } from "react";
import { X, Check, AlertTriangle, ShieldAlert, Info } from "lucide-react";

interface ToastProps {
  message: string;
  model: "default" | "alert" | "danger" | "success";
  onClose: () => void;
}

const toastModels = {
  default: { bg: "bg-blue-500 text-white", icon: <Info /> },
  alert: { bg: "bg-yellow-500 text-black", icon: <AlertTriangle /> },
  danger: { bg: "bg-red-500 text-white", icon: <ShieldAlert /> },
  success: { bg: "bg-green-500 text-white", icon: <Check /> },
};

export function Toast({ message, model, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);

  // Controla a entrada inicial
  useEffect(() => {
    setVisible(true);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300); // espera animação antes de remover
  };

  const { bg, icon } = toastModels[model];

  return (
    <div
      className={`
    w-full px-6 py-2 rounded-lg shadow-lg flex items-center justify-between gap-4
    ${bg} transition-all duration-300 transform
    ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}
  `}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span>{message}</span>
      </div>
      <X className="cursor-pointer" size={20} onClick={handleClose} />
    </div>
  );
}
