import { Metadata } from "next";
import Image from "next/image";
import { ContainerForms } from "./Form";
import Bg_image from "../../assets/bg-signIn.jpg";
import { NOME_LOJA } from "../../utils/env";

export const metadata: Metadata = {
  title: `Login - ${NOME_LOJA}`,
  description: `Faça login para acessar sua conta ${NOME_LOJA}.`,
};

export default function SignIn() {
  return (
    <div className="min-h-[calc(100dvh-106px)] lg:min-h-[calc(100dvh-114px)] w-full flex flex-col lg:flex-row">
      <div className="w-full flex-1 h-screen max-h-[calc(100dvh-106px)] lg:max-h-[calc(100dvh-114px)] absolute lg:relative">
        <Image
          src={Bg_image}
          alt="Background, família feliz sorrindo em um parque"
          priority
          className="opacity-60 h-full w-full object-cover"
        />
      </div>
      <div className="w-full max-w-[94%] sm:max-w-[350px] lg:max-w-[440px] h-screen max-h-[calc(100dvh-106px)] lg:max-h-[calc(100dvh-114px)] mx-auto flex items-center justify-center">
        <div className="w-full bg-white/60 lg:bg-[var(--bg-form-login)] relative rounded-lg p-4 md:p-8 lg:p-12 mx-auto">
          <ContainerForms />
        </div>
      </div>
    </div>
  );
}
