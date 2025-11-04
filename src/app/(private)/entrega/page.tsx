import { Container } from "@/app/components/Container";
import { Resumo } from "../../components/Resumo";
import { FormDadosEntrega } from "./Form";
import { StepsPurchase } from "@/app/components/StepsPayment";

export default function Entrega() {
  return (
    <div className="min-h-[calc(100dvh-114px)] w-full flex flex-col lg:flex-row bg-body-bg pt-14">
      <Container>
        <StepsPurchase step="Entrega" />
        <div className="flex w-full h-full flex-col lg:flex-row">
          <FormDadosEntrega />
          <div className="w-full lg:w-80 lg:max-w-80 h-full border-t lg:border-t-0 lg:border-l border-gray-300 p-4">
            <Resumo delivery={{ stateCode: "SP", city: "São Paulo", zipCode: "04470095" }} />
          </div>
        </div>
      </Container>
    </div>
  );
}
