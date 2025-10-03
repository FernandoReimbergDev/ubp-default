import { Container } from "@/app/components/Container";
import { Resumo } from "@/app/components/Resumo";
import { StepsPurchase } from "@/app/components/StepsPayment";
import { FormPagamento } from "./Form";

export default function formaPagamento() {
  return (
    <div className="min-h-[calc(100dvh-114px)] w-full flex flex-col lg:flex-row bg-body-bg pt-16">
      <Container>
        <StepsPurchase step="Pagamento" />
        <div className="w-full h-full grid grid-cols-1 lg:grid-cols-[1fr_minmax(200px,350px)] gap-4">
          <FormPagamento />
          <div className="w-full h-full border-t lg:border-t-0 lg:border-l border-gray-300 p-4">
            <Resumo />
          </div>
        </div>
      </Container>
    </div>
  );
}
