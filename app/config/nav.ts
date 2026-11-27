export type IconName =
  | "dashboard"
  | "notifications"
  | "rawMaterial"
  | "productionOrder"
  | "traceability"
  | "products"
  | "suppliers"
  | "purchaseOrders";

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
  {
    title: "Compras",
    items: [
      { label: "Produtos", href: "/produtos", icon: "products" },
      { label: "Fornecedores", href: "/fornecedores", icon: "suppliers" },
      { label: "Pedidos de compra", href: "/pedidos-compra", icon: "purchaseOrders" },
    ],
  },
];

/** `true` quando `pathname` é `href` ou uma sub-rota dele (ignora a query string). */
export function isActivePath(pathname: string, href: string) {
  const cleanHref = href.split("?")[0];
  return pathname === cleanHref || pathname.startsWith(`${cleanHref}/`);
}

type SearchParamsLike = { get(name: string): string | null };

/**
 * Escolhe no máximo UM subitem ativo:
 * 1. considera só os filhos cujo caminho casa com `pathname`, ficando com o
 *    caminho mais específico (ex.: /materia-prima/estoque vence /materia-prima);
 * 2. entre eles, prefere o que tem todos os parâmetros de query iguais aos atuais;
 * 3. se nenhum casar a query (ex.: /notificacoes sem ?filtro), usa o primeiro,
 *    que é a visão padrão da página.
 */
export function getActiveChild(
  pathname: string,
  children: NavLink[] | undefined,
  searchParams?: SearchParamsLike | null,
): NavLink | undefined {
  if (!children?.length) return undefined;

  const matches = children.filter((c) => isActivePath(pathname, c.href));
  if (!matches.length) return undefined;

  const pathLength = (c: NavLink) => c.href.split("?")[0].length;
  const longest = Math.max(...matches.map(pathLength));
  const best = matches.filter((c) => pathLength(c) === longest);

  if (searchParams) {
    const byQuery = best.find((c) => {
      const query = c.href.split("?")[1];
      if (!query) return false;
      return [...new URLSearchParams(query)].every(
        ([key, value]) => searchParams.get(key) === value,
      );
    });
    if (byQuery) return byQuery;
  }

  return best[0];
}

/** Monta o breadcrumb da topbar a partir da configuração da navegação. */
export function getBreadcrumbs(
  pathname: string,
  searchParams?: SearchParamsLike | null,
): NavLink[] {
  for (const section of navSections) {
    for (const item of section.items) {
      if (!isActivePath(pathname, item.href)) continue;
      const crumbs: NavLink[] = [{ label: item.label, href: item.href }];
      const child = getActiveChild(pathname, item.children, searchParams);
      if (child) crumbs.push(child);
      return crumbs;
    }
  }
  return [];
}
