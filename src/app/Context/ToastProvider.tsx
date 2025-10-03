"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { Toast } from "../components/Toast";
import { ToastContextType, ToastModel } from "../types/responseTypes";

interface ToastMessage {
  id: number;
  message: string;
  model: ToastModel;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, model: ToastModel) => {
    const id = toastId++;
    setToasts((prev) => [...prev, { id, message, model }]);

    // 5000ms visível + 300ms de saída
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2300);
  };

  const contextValue: ToastContextType = {
    success: (msg) => showToast(msg, "success"),
    alert: (msg) => showToast(msg, "alert"),
    danger: (msg) => showToast(msg, "danger"),
    default: (msg) => showToast(msg, "default"),
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div
        className="
          fixed top-10 left-1/2 -translate-x-1/2 z-50 
          flex flex-col items-center space-y-3 
          w-full max-w-sm px-4
        "
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} model={toast.model} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast deve ser usado dentro de um ToastProvider");
  }
  return context;
}
