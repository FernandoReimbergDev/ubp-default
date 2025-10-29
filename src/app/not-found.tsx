import Image from "next/image";
import Link from "next/link";

import logo from "./components/assets/logo-banner.png";
import { Button } from "./components/Button";

export default function NotFound() {
    return (
        <div className="flex w-screen px-8 min-h-screen items-center justify-center">

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
