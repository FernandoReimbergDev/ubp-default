import { Container } from "@/app/components/Container";
import { StepsPurchase } from "@/app/components/StepsPayment";
import { LIMITE_PARCELAMENTO, TAXA_JUROS } from "@/app/utils/env";
import { FormaPagamentoClient } from "./partials/FormaPagamentoClient";

export default function formaPagamento() {
  return (
    <div className="min-h-[calc(100dvh-114px)] w-full flex flex-col lg:flex-row bg-body-bg pt-16">
      <Container>
        <StepsPurchase step="Pagamento" />
        <h1 className="mx-auto mt-4 text-xl">Selecione a Forma de Pagamento</h1>
        <FormaPagamentoClient limiteParcelamento={LIMITE_PARCELAMENTO} juros={TAXA_JUROS} />
      </Container>
    </div>
  );
}
