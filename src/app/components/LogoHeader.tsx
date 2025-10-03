import Image from "next/image";
import Link from "next/link";
import logoQuadrado from "./assets/logo header.png";
import logoHorizontal from "./assets/logo header.png";
import logoVertical from "./assets/logo header.png";

export function LogoSquare() {
  return (
    <Link href={"/"} className="flex items-center justify-center h-11 w-11">
      <Image src={logoQuadrado} alt={`Logotipo ${"AMIL"}`} priority fill className="object-contain" />
    </Link>
  );
}

export function LogoHorizontal() {
  return (
    <Link href={"/"} className="flex items-center justify-center h-auto w-26">
      <Image src={logoHorizontal} alt={`Logotipo ${"AMIL"}`} priority className="object-contain" />
    </Link>
  );
}

export function LogoVertical() {
  return (
    <Link href={"/"} className="flex items-center justify-center h-11 max-w-11">
      <Image src={logoVertical} alt={`Logotipo ${"AMIL"}`} priority fill className="object-contain" />
    </Link>
  );
}
