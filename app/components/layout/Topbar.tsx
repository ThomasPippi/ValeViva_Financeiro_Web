"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getBreadcrumbs } from "@/app/config/nav";
import { MenuIcon } from "./Icons";
import ThemeToggle from "./ThemeToggle";
import styles from "./Topbar.module.css";

type TopbarProps = {
  mobileOpen: boolean;
  onOpenMenu: () => void;
};

export default function Topbar({ mobileOpen, onOpenMenu }: TopbarProps) {
  const pathname = usePathname();
  const crumbs = getBreadcrumbs(pathname);

  return (
    <header className={styles.topbar}>
      <button
        type="button"
        className={`${styles.iconButton} ${styles.menuButton}`}
        onClick={onOpenMenu}
        aria-label="Abrir menu"
        aria-controls="app-sidebar"
        aria-expanded={mobileOpen}
      >
        <MenuIcon />
      </button>

      <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
        <ol>
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <li key={crumb.href}>
                {isLast ? (
                  <span aria-current="page">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href}>{crumb.label}</Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className={styles.actions}>
        <ThemeToggle className={styles.iconButton} />
        {/* Placeholder até existir autenticação. */}
        <span className={styles.avatar} title="Usuário">
          U
        </span>
      </div>
    </header>
  );
}
