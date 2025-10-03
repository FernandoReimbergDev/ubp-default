import Image from "next/image";
import Link from "next/link";

import notFoundimg from "./components/assets/404.svg";
import logo from "./components/assets/logo-banner.png";
import { Button } from "./components/Button";

export default function NotFound() {
    return (
        <div className="flex max-w-[90%] px-8 min-h-screen items-center flex-col-reverse md:flex-row justify-center">
            <div>
                <Image src={notFoundimg} alt="imagem de um astronauto e o erro 404" />
            </div>
            <div className="flex flex-col justify-start gap-4 md:gap-8">
                <Image src={logo} alt="logo amil" className="w-32" />
                <h2 className="text-2xl font-bold">Oops Página não encontrada!</h2>
                <p className="text-lg text-gray-500 max-w-[300px]">
                    Mais não se preocupe, clique no botão abaixo para voltar.
                </p>
                <Link href={"/"} className="max-w-fit">
                    <Button>
                        Retornar à Home
                    </Button>
                </Link>
            </div>
        </div>
    );
}
