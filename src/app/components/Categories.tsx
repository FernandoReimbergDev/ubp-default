import Link from "next/link";

interface CategoriasProps {
    icon: React.ReactNode;
    text: string;
    href: string;
}

export function Categories({ icon, text, href }: CategoriasProps) {
    return (
        <Link href={href} className="w-20 h-20 2xl:w-24 2xl:h-24 bg-Categorias-bgCategoria rounded-xl flex flex-col items-center justify-center shadow-lg cursor-pointer overflow-hidden gap-1  group">
            <i className="text-Categorias-text text-xs group-hover:animate-slide-in-top">{icon}</i>
            <p className="text-Categorias-text  text-xs">{text}</p>
        </Link>
    );
}
