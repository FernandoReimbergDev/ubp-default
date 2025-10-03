import type { ComponentProps } from "react";

export function Button(props: ComponentProps<"button">) {
  return (
    <button
      className="py-2 px-4 rounded-lg flex justify-between items-center w-full bg-Button-bg hover:bg-Button-bgHover 
             text-white hover:text-Button-textHover hover:border-Button-borderHover font-semibold cursor-pointer border-2 border-Button-bg
             transition-colors duration-200"
      {...props}
    />
  );
}
