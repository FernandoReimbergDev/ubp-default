"use client";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function SearchBar() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const previousSearchText = searchParams?.get("term") || "";

  const [inputValue, setInputValue] = useState(previousSearchText);

  function SearchItems() {
    const urlSearchParams = new URLSearchParams(searchParams);
    if (inputValue.trim()) {
      urlSearchParams.set("term", inputValue.trim());
    } else {
      urlSearchParams.delete("term");
    }
    router.replace(`/search?${urlSearchParams.toString()}`);
  }

  return (
    <div className="group flex w-full xl:w-[200px] items-center justify-center relative xl:mr-8 shadow-lg bg-SearchBar-bg rounded-lg transition-all">
      <form onSubmit={(e) => e.preventDefault()} className="relative flex items-center justify-between w-full">
        <input
          type="search"
          name="term"
          placeholder="Faça sua pesquisa"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="p-2 w-full lg:w-[200px] h-8 rounded-md text-sm text-fontColor border-none focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Pesquisar"
          className="absolute right-1 p-1 cursor-pointer text-SearchBar-text border-none bg-SearchBar-bg place-items-center rounded-md"
          onClick={SearchItems}
        >
          <Search className="mx-auto" size={18} />
        </button>
      </form>

      <div className="absolute inset-0 rounded-lg pointer-events-none border-2 group-focus-within:border-SearchBar-borderFocus border-SearchBar-border" />
    </div>
  );
}
