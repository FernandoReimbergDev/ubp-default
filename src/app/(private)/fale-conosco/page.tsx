import { Container } from "@/app/components/Container";
import { FormFaleConosco } from "./partials/Form";
import { TitleSection } from "@/app/components/TitleSection";
import { Mail } from "lucide-react";
export default function MeusDados() {
  return (
    <div className="min-h-[calc(100dvh-114px)] w-full flex flex-col lg:flex-row bg-body-bg pt-16">
      <Container>
        <TitleSection text="Fale Conosco" icon={<Mail size={28} className="text-green-600" />} />
        <div className="flex w-full h-full flex-col lg:flex-row">
          <FormFaleConosco />
        </div>
      </Container>
    </div>
  );
}
