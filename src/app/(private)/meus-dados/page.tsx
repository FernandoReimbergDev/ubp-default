import { Container } from "@/app/components/Container";
import { FormMeusDados } from "./partials/Form";
import { TitleSection } from "@/app/components/TitleSection";
import { UserPen } from "lucide-react";
export default function MeusDados() {
  return (
    <div className="min-h-[calc(100dvh-114px)] w-full flex flex-col lg:flex-row bg-body-bg pt-14">
      <Container>
        <TitleSection text="Meus Dados" icon={<UserPen size={28} className="text-green-600" />} />
        <div className="flex w-full h-full flex-col lg:flex-row">
          <FormMeusDados />
        </div>
      </Container>
    </div>
  );
}
