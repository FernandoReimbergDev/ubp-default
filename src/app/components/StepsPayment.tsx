import { CircleCheckBig, CreditCard, Minus, Truck } from "lucide-react";

interface StepsProps {
  step: string;
}

export function StepsPurchase({ step }: StepsProps) {
  return (
    <div className="gap-4 hidden md:flex">
      {/* <span className={` flex gap-1 items-center text-sm ${step === "Carrinho" ? "text-sky-500" : "text-gray-300"}`}>
        <ShoppingCart />
        Carrinho
      </span>

      <Minus className="text-gray-300" /> */}

      <span className={` flex gap-1 items-center text-sm ${step === "Entrega" ? "text-sky-500" : "text-gray-300"}`}>
        <Truck />
        Entrega
      </span>
      <Minus className="text-gray-300" />
      {/* <span className={` flex gap-1 items-center text-sm ${step === "Pagamento" ? "text-sky-500" : "text-gray-300"}`}>
        <Barcode />
        Pagamento
      </span>
      <Minus className="text-gray-300" /> */}
      <span className={` flex gap-1 items-center text-sm ${step === "Pagamento" ? "text-sky-500" : "text-gray-300"}`}>
        <CreditCard />
        Checkout
      </span>
      <Minus className="text-gray-300" />
      <span className={` flex gap-1 items-center text-sm ${step === "Conclusão" ? "text-sky-500" : "text-gray-300"}`}>
        <CircleCheckBig />
        Conclusão
      </span>
    </div>
  );
}
