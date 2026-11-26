"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActivePath, type NavLink } from "@/app/config/nav";
import styles from "./SectionTabs.module.css";

/** Abas de sub-rotas, usadas no layout de uma seção (ex.: /financeiro). */
export default function SectionTabs({ items, label }: { items: NavLink[]; label: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label={label} className={styles.tabs}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={styles.tab}
          aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
