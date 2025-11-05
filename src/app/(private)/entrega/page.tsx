import { Container } from "@/app/components/Container";
import { Resumo } from "../../components/Resumo";
import { FormDadosEntrega } from "./Form";
import { StepsPurchase } from "@/app/components/StepsPayment";

export default function Entrega() {
  return (
    <div className="min-h-[calc(100dvh-114px)] w-full flex flex-col lg:flex-row bg-body-bg pt-14">
      <Container>
        <StepsPurchase step="Entrega" />
        <FormDadosEntrega />

      </Container>
    </div>
  );
}
