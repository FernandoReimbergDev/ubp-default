import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

interface InputRootProps extends React.ComponentProps<"div"> {
  error?: boolean;
}

export function InputRoot({ error = false, className, ...props }: InputRootProps) {
  return (
    <div
      className={twMerge(
        "group w-full flex bg-white h-10 rounded-lg px-4 items-center gap-2 border-2 border-slate-400 focus-within:border-sky-500 focus-within:border-2 data-[error=true]:border-red-500 data-[error=true]:border-2 overflow-hidden",
        className
      )}
      data-error={error}
      {...props}
    />
  );
}

interface InputIconProps extends React.ComponentProps<"span"> {
  error?: boolean;
}

export function InputIcon(props: InputIconProps) {
  return (
    <span
      className="text-gray-400 group-focus-within:text-fontColor group-[&:not(:has(input:placeholder-shown))]:text-fontColor group-data-[error=true]:text-danger"
      {...props}
    />
  );
}

export function InputField({ className, ...props }: ComponentProps<"input">) {
  return <input className={twMerge("flex-1 outline-none placeholder-gray-400 bg-transparent", className)} {...props} />;
}
