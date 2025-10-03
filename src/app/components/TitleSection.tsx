interface TitleProps {
  icon: React.ReactNode;
  text: string;
}

export function TitleSection({ icon, text }: TitleProps) {
  return (
    <div className="flex items-center justify-center mx-auto mb-4 gap-2">
      {icon}
      <p className="text-lg xl:text-lg 2xl:text-xl font-bold text-TitleSection-text">{text}</p>
    </div>
  );
}
