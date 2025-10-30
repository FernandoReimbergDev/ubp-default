import Image, { StaticImageData } from "next/image";
import Logo from "./assets/logo-banner.png";

interface BannerProps {
  imgSrc?: string | StaticImageData;
  alt: string;
}

export function Banner({ imgSrc, alt }: BannerProps) {
  return (
    <div className="bg-Banner-bg w-full h-fit py-16 rounded-xl flex flex-col items-center justify-center revelScroll overflow-hidden relative">
      <Image src={Logo || imgSrc} alt={alt} className="object-contain md:max-w-[80%]" priority />
    </div>
  );
}
