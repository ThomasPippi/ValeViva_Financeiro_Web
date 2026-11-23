export type IconName =
  | "dashboard"
  | "wallet"
  | "notifications"
  | "rawMaterial"
  | "productionOrder"
  | "traceability";

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
      {
        label: "Notificações",
        href: "/notificacoes",
        icon: "notifications",
        children: [
          {
            label: "Todas as notificações",
            href: "/notificacoes?filtro=todas",
          },
          {
            label: "Alertas não lidos",
            href: "/notificacoes?filtro=nao-lidas",
          },
        ],
      },
      {
        label: "Matéria-Prima",
        href: "/materia-prima",
        icon: "rawMaterial",
        children: [
          { label: "Cadastro de insumos", href: "/materia-prima" },
          { label: "Estoque e lotes", href: "/materia-prima/estoque" },
        ],
      },
      {
        label: "Ordem de Produção",
        href: "/ordem-producao",
        icon: "productionOrder",
        children: [
          { label: "Ordens de produção", href: "/ordem-producao?view=lista" },
          { label: "Nova ordem", href: "/ordem-producao?view=nova" },
        ],
      },
      {
        label: "Rastreabilidade",
        href: "/rastreabilidade",
        icon: "traceability",
      },
    ],
  },
];

/** `true` quando `pathname` é `href` ou uma sub-rota dele. */
export function isActivePath(pathname: string, href: string) {
  const cleanHref = href.split("?")[0];
  return pathname === cleanHref || pathname.startsWith(`${cleanHref}/`);
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