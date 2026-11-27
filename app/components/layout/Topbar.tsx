"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { getBreadcrumbs, type NavLink } from "@/app/config/nav";
import { MenuIcon } from "./Icons";
import ThemeToggle from "./ThemeToggle";
import styles from "./Topbar.module.css";

type TopbarProps = {
  mobileOpen: boolean;
  onOpenMenu: () => void;
};

export default function Topbar({ mobileOpen, onOpenMenu }: TopbarProps) {
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
        {/* A URL só é conhecida em runtime em rotas dinâmicas: fica dentro de Suspense. */}
        <Suspense fallback={<ol />}>
          <Breadcrumb />
        </Suspense>
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

function Breadcrumb() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return <BreadcrumbList crumbs={getBreadcrumbs(pathname, searchParams)} />;
}

function BreadcrumbList({ crumbs }: { crumbs: NavLink[] }) {
  return (
    <ol>
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        // Pai e filho podem ter o mesmo href (ex.: /materia-prima), então a key usa o índice.
        return (
          <li key={`${i}-${crumb.href}`}>
            {isLast ? (
              <span aria-current="page">{crumb.label}</span>
            ) : (
              <Link href={crumb.href}>{crumb.label}</Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}
