"use client";

import { useState } from "react";
import { Resumo } from "@/app/components/Resumo";
import { MethodsPayments } from "./methodsPayment";

interface FormaPagamentoClientProps {
  limiteParcelamento: number;
  juros: number;
}

export function FormaPagamentoClient({ limiteParcelamento, juros }: FormaPagamentoClientProps) {
  const [selectedPaymentData, setSelectedPaymentData] = useState<{
    method: string;
    total: number;
    installments?: number;
    installmentValue?: number;
  } | null>(null);

  const handlePaymentMethodChange = (
    method: string,
    total: number,
    installments?: number,
    installmentValue?: number
  ) => {
    setSelectedPaymentData({
      method,
      total,
      installments,
      installmentValue,
    });
  };

  return (
    <div className="w-full h-full grid grid-cols-1 lg:grid-cols-[1fr_minmax(200px,350px)] gap-4">
      <MethodsPayments
        onPaymentMethodChange={handlePaymentMethodChange}
        limiteParcelamento={limiteParcelamento}
        juros={juros}
      />
      <div className="w-full h-full border-t lg:border-t-0 lg:border-l border-gray-300 p-4">
        <Resumo
          selectedPaymentTotal={selectedPaymentData?.total}
          selectedPaymentMethod={selectedPaymentData?.method}
          selectedInstallments={selectedPaymentData?.installments}
        />
      </div>
    </div>
  );
}
