"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { isActivePath, navSections, type NavItem } from "@/app/config/nav";
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

export default function Sidebar({ mobileOpen, onNavigate }: SidebarProps) {
  const pathname = usePathname();
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

  function renderItem(item: NavItem) {
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
                aria-current={isActivePath(pathname, child.href) ? "page" : undefined}
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

  return (
    <aside
      id="app-sidebar"
      className={`${styles.sidebar} ${mobileOpen ? styles.open : ""}`}
      aria-label="Navegação principal"
    >
      <div className={styles.brand}>
        <span className={styles.logo}>VV</span>
        <span className={styles.brandText}>
          <strong>ValeViva</strong>
          <small>Financeiro</small>
        </span>
      </div>

      <nav className={styles.nav}>
        {navSections.map((section) => (
          <div key={section.title} className={styles.section}>
            <p className={styles.sectionTitle}>
              <span>{section.title}</span>
            </p>
            <ul className={styles.list}>{section.items.map(renderItem)}</ul>
          </div>
        ))}
      </nav>

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
