import Image from "next/image";
import Link from "next/link";

import logo from "./assets/logo-header.png";
import { Button } from "./components/Button";

export default function NotFound() {
    return (
        <div className="flex w-screen min-h-screen items-center justify-center">

            <div className="flex flex-col justify-start gap-4 md:gap-8">
                <Image src={logo} alt="logo UBP" priority className="max-w-64" />
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
