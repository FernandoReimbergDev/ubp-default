import { Container } from "@/app/components/Container";
import { FormDadosEntrega } from "./Form";
import { StepsPurchase } from "@/app/components/StepsPayment";

export default function Entrega() {
  return (
    <div className="min-h-[calc(100dvh-114px)] w-full flex flex-col lg:flex-row bg-body-bg pt-14">
      <Container>
        <StepsPurchase step="Entrega" />
        <div className="flex w-full h-full flex-col lg:flex-row">
          <FormDadosEntrega />
        </div>
      </Container>
    </div>
  );
}
