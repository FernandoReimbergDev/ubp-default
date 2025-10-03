import Image, { StaticImageData } from "next/image";
import Logo from "./assets/logo-banner.png";

interface BannerProps {
  imgSrc?: string | StaticImageData;
  alt: string;
}

export function Banner({ imgSrc, alt }: BannerProps) {
  return (
    <div className="bg-Banner-bg w-full h-48 rounded-xl flex flex-col items-center justify-center revelScroll overflow-hidden relative">
      <Image src={Logo || imgSrc} alt={alt} width={315} height={112} className="object-contain" />
    </div>
  );
}
