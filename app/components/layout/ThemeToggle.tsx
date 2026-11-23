"use client";

import { MoonIcon, SunIcon } from "./Icons";

// Os dois ícones são renderizados e o CSS mostra o correto conforme
// data-theme no <html> — assim não há flash nem divergência de hidratação.
export default function ThemeToggle({ className }: { className?: string }) {
  function toggle() {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
  }

  return (
    <button
      type="button"
      className={className}
      onClick={toggle}
      aria-label="Alternar tema claro/escuro"
      title="Alternar tema"
    >
      <SunIcon className="hidden dark:block" />
      <MoonIcon className="block dark:hidden" />
    </button>
  );
}
