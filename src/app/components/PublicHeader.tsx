import { LogoHorizontal } from "./LogoHeader";

export function PublicHeader() {
  return (
    <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full z-49 fixNavbar">
      <div className="w-full min-h-11 h-fit xl:h-fit xl:max-h-12 flex justify-between items-center py-2 xl:py-4 px-4 bg-Header-bg shadow-lg 2xl:max-w-7xl xl:max-w-5xl xl:mx-auto xl:mt-4 xl:rounded-lg relative">
        <LogoHorizontal />
      </div>
    </header>
  );
}
