import { Container } from "@/app/components/Container";
import { Resumo } from "@/app/components/Resumo";
import { StepsPurchase } from "@/app/components/StepsPayment";
import { FormDadosFaturamento } from "./Form";

export default function Entrega() {
  return (
    <div className="min-h-[calc(100dvh-114px)] w-full flex flex-col lg:flex-row bg-body-bg pt-14">
      <Container>
        <StepsPurchase step="Confirmação" />
        <div className="flex w-full h-full flex-col lg:flex-row">
          <FormDadosFaturamento />
          <div className="w-full lg:w-96 h-full border-t lg:border-t-0 lg:border-l border-gray-300 p-4">
            <Resumo />
          </div>
        </div>
      </Container>
    </div>
  );
}
