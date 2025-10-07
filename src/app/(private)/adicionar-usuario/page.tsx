import { Container } from "@/app/components/Container";
import { FormAdicionarUsuario } from "./partials/Form";
import { TitleSection } from "@/app/components/TitleSection";
import { UserRoundPlus } from "lucide-react";
export default function AdiconarUsuario() {
  return (
    <div className="min-h-[calc(100dvh-114px)] w-full flex flex-col lg:flex-row bg-body-bg pt-16">
      <Container>
        <TitleSection text="Cadastro novo usuário" icon={<UserRoundPlus size={28} className="text-green-500" />} />
        <div className="flex w-full h-full flex-col lg:flex-row">
          <FormAdicionarUsuario />
        </div>
      </Container>
    </div>
  );
}
