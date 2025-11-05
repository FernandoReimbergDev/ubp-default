import { Container } from "@/app/components/Container";
import { StepsPurchase } from "@/app/components/StepsPayment";
import { SolicitarAprovacao } from "./partials/solicitarAprovacao";

export default function formaPagamento() {
  return (
    <div className="min-h-[calc(100dvh-114px)] w-full flex flex-col lg:flex-row bg-body-bg pt-16">
      <Container>
        <StepsPurchase step="Pagamento" />
        <h1 className="mx-auto mt-4 text-xl">Confirmação do Pedido</h1>
        <div className="w-full h-full grid grid-cols-1 gap-6">
          <SolicitarAprovacao />
        </div>
      </Container>
    </div>
  );
}
