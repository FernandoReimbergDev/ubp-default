interface ContainerProps {
  children: React.ReactNode;
}

export function Container({ children }: ContainerProps) {
  return (
    <div
      className="w-[94%] min-w-[350px] lg:max-w-screen-lg xl:max-w-5xl 2xl:max-w-7xl bg-Container-bg 
			my-8 rounded-md p-4 shadow-xl flex flex-col mx-auto
			items-center justify-start gap-2"
    >
      {children}
    </div>
  );
}
