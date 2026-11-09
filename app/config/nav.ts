export type IconName = "dashboard" | "wallet";

export type NavLink = {
  label: string;
  href: string;
};

export type NavItem = NavLink & {
  icon: IconName;
  /** Sub-rotas exibidas como submenu na sidebar. */
  children?: NavLink[];
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const navSections: NavSection[] = [
  {
    title: "Geral",
    items: [{ label: "Dashboard", href: "/dashboard", icon: "dashboard" }],
  },
  {
    title: "Gestão",
    items: [
      {
        label: "Financeiro",
        href: "/financeiro",
        icon: "wallet",
        children: [
          { label: "Contas a pagar", href: "/financeiro/contas-a-pagar" },
          { label: "Contas a receber", href: "/financeiro/contas-a-receber" },
        ],
      },
    ],
  },
];

/** `true` quando `pathname` é `href` ou uma sub-rota dele. */
export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Monta o breadcrumb da topbar a partir da configuração da navegação. */
export function getBreadcrumbs(pathname: string): NavLink[] {
  const crumbs: NavLink[] = [];
  for (const section of navSections) {
    for (const item of section.items) {
      if (!isActivePath(pathname, item.href)) continue;
      crumbs.push({ label: item.label, href: item.href });
      const child = item.children?.find((c) => isActivePath(pathname, c.href));
      if (child) crumbs.push(child);
      return crumbs;
    }
  }
  return crumbs;
}
