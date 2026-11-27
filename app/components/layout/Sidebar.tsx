"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  getActiveChild,
  isActivePath,
  navSections,
  type NavItem,
} from "@/app/config/nav";
import { ChevronIcon, CollapseIcon, navIcons } from "./Icons";
import styles from "./Sidebar.module.css";

const DESKTOP_QUERY = "(min-width: 900px)";

function isCollapsed() {
  return document.documentElement.getAttribute("data-sidebar") === "collapsed";
}

function setCollapsed(collapsed: boolean) {
  const root = document.documentElement;
  if (collapsed) root.setAttribute("data-sidebar", "collapsed");
  else root.removeAttribute("data-sidebar");
  try {
    localStorage.setItem("sidebar", collapsed ? "collapsed" : "expanded");
  } catch {}
}

type SidebarProps = {
  mobileOpen: boolean;
  onNavigate: () => void;
};

type ActiveRoute = {
  pathname: string;
  searchParams: URLSearchParams | null;
};

export default function Sidebar({ mobileOpen, onNavigate }: SidebarProps) {
  // Estado manual de abertura dos grupos; sem valor = aberto se a rota estiver ativa.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  function toggleGroup(href: string, isOpen: boolean) {
    // Sidebar recolhida no desktop: expande o menu e abre o grupo clicado.
    if (isCollapsed() && window.matchMedia(DESKTOP_QUERY).matches) {
      setCollapsed(false);
      setOpenGroups((g) => ({ ...g, [href]: true }));
      return;
    }
    setOpenGroups((g) => ({ ...g, [href]: !isOpen }));
  }

  function renderItem(item: NavItem, { pathname, searchParams }: ActiveRoute) {
    const Icon = navIcons[item.icon];
    const active = isActivePath(pathname, item.href);

    if (!item.children) {
      return (
        <li key={item.href}>
          <Link
            href={item.href}
            className={styles.link}
            aria-current={active ? "page" : undefined}
            title={item.label}
            onClick={onNavigate}
          >
            <Icon className={styles.icon} />
            <span className={styles.label}>{item.label}</span>
          </Link>
        </li>
      );
    }

    const isOpen = openGroups[item.href] ?? active;
    const submenuId = `submenu-${item.href.replaceAll("/", "")}`;
    // Só um subitem fica ativo por vez (ver getActiveChild).
    const activeChild = getActiveChild(pathname, item.children, searchParams);

    return (
      <li key={item.href}>
        <button
          type="button"
          className={styles.link}
          data-active={active}
          aria-expanded={isOpen}
          aria-controls={submenuId}
          title={item.label}
          onClick={() => toggleGroup(item.href, isOpen)}
        >
          <Icon className={styles.icon} />
          <span className={styles.label}>{item.label}</span>
          <ChevronIcon className={styles.chevron} width={16} height={16} />
        </button>
        <ul id={submenuId} className={styles.sublist} hidden={!isOpen}>
          {item.children.map((child) => (
            <li key={child.href}>
              <Link
                href={child.href}
                className={styles.sublink}
                aria-current={child === activeChild ? "page" : undefined}
                onClick={onNavigate}
              >
                {child.label}
              </Link>
            </li>
          ))}
        </ul>
      </li>
    );
  }

  function renderNav(route: ActiveRoute) {
    return (
      <nav className={styles.nav}>
        {navSections.map((section) => (
          <div key={section.title} className={styles.section}>
            <p className={styles.sectionTitle}>
              <span>{section.title}</span>
            </p>
            <ul className={styles.list}>
              {section.items.map((item) => renderItem(item, route))}
            </ul>
          </div>
        ))}
      </nav>
    );
  }

  return (
    <aside
      id="app-sidebar"
      className={`${styles.sidebar} ${mobileOpen ? styles.open : ""}`}
      aria-label="Navegação principal"
    >
      <Link href="/dashboard" className={styles.brand} onClick={onNavigate}>
        {/* Texto escuro no tema claro, texto branco no tema escuro. */}
        <Image
          src="/brand/logo-escura.png"
          alt="ValeViva — Gestão inteligente"
          width={391}
          height={120}
          className={`${styles.logoFull} ${styles.logoOnLight}`}
          priority
        />
        <Image
          src="/brand/logo-branca.png"
          alt="ValeViva — Gestão inteligente"
          width={391}
          height={120}
          className={`${styles.logoFull} ${styles.logoOnDark}`}
          priority
        />
        {/* Menu recolhido no desktop: só o símbolo cabe. */}
        <Image
          src="/brand/simbolo.png"
          alt="ValeViva"
          width={160}
          height={97}
          className={styles.logoSymbol}
          priority
        />
      </Link>

      {/* A rota atual só é conhecida em runtime em rotas dinâmicas (ex.: /pedidos-compra/[id]),
          então a parte que depende dela fica num Suspense; o fallback é o menu sem item ativo. */}
      <Suspense fallback={renderNav({ pathname: "", searchParams: null })}>
        <WithActiveRoute render={renderNav} />
      </Suspense>

      <div className={styles.footer}>
        <button
          type="button"
          className={`${styles.link} ${styles.collapseButton}`}
          onClick={() => setCollapsed(!isCollapsed())}
          title="Recolher/expandir menu"
        >
          <CollapseIcon className={styles.icon} />
          <span className={styles.label}>Recolher menu</span>
        </button>
      </div>
    </aside>
  );
}

function WithActiveRoute({ render }: { render: (route: ActiveRoute) => React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return render({ pathname, searchParams });
}
