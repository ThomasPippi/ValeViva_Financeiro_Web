export type StatusQualidade =
  | "PENDENTE"
  | "APROVADO"
  | "REPROVADO"
  | "BLOQUEADO";

export type TipoMovimentacao = "ENTRADA" | "SAIDA";

export type SaldoEstoqueItem = {
  id?: number;
  produtoId?: number;
  codigoProduto?: string;
  descricaoProduto?: string;
  unidade?: string;
  estoqueMinimo?: number;
  loteId?: number;
  codigoLote: string;
  validade?: string | null;
  statusQualidade?: StatusQualidade | string;
  registroAnvisaVigente?: boolean;
  quantidade: number;
};

export type MovimentacaoEstoque = {
  id: number;
  tipo: TipoMovimentacao | string;
  codigoLote: string;
  codigoProduto?: string;
  descricaoProduto?: string;
  quantidade: number;
  dataHora: string;
  usuario: string;
  origemDestino?: string | null;
};

export type EntradaEstoqueInput = {
  codigoLote: string;
  quantidade: number;
  usuario: string;
  origemDestino?: string;
  validade?: string;
  statusQualidade?: StatusQualidade;
};

export type ExpedicaoInput = {
  codigoLote: string;
  quantidade: number;
  destino: string;
  usuario: string;
};

export type RastreabilidadeLote = {
  codigoLote: string;
  produtoCodigo?: string;
  produtoDescricao?: string;
  ordemOrigem?: string | null;
  validade?: string | null;
  statusQualidade?: string;
  saldoAtual?: number;
  movimentacoes?: MovimentacaoEstoque[];
  destinos?: string[];
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const texto = await res.text().catch(() => "");
    throw new Error(texto || `Erro HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function listarSaldosEstoque(): Promise<SaldoEstoqueItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/estoque/saldos`, {
    cache: "no-store",
  });
  return parseResponse<SaldoEstoqueItem[]>(res);
}

export async function listarMovimentacoesEstoque(params?: {
  inicio?: string;
  fim?: string;
  produto?: string;
}): Promise<MovimentacaoEstoque[]> {
  const search = new URLSearchParams();
  if (params?.inicio) search.set("inicio", params.inicio);
  if (params?.fim) search.set("fim", params.fim);
  if (params?.produto) search.set("produto", params.produto);

  const qs = search.toString();
  const url = qs
    ? `${API_BASE_URL}/api/estoque/movimentacoes?${qs}`
    : `${API_BASE_URL}/api/estoque/movimentacoes`;

  const res = await fetch(url, { cache: "no-store" });
  return parseResponse<MovimentacaoEstoque[]>(res);
}

export async function registrarEntradaEstoque(
  payload: EntradaEstoqueInput
): Promise<SaldoEstoqueItem | MovimentacaoEstoque> {
  const res = await fetch(`${API_BASE_URL}/api/estoque/entradas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<SaldoEstoqueItem | MovimentacaoEstoque>(res);
}

export async function registrarExpedicao(
  payload: ExpedicaoInput
): Promise<MovimentacaoEstoque | Record<string, unknown>> {
  const res = await fetch(`${API_BASE_URL}/api/expedicoes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<MovimentacaoEstoque | Record<string, unknown>>(res);
}

export async function consultarRastreabilidadeLote(
  codigoLote: string
): Promise<RastreabilidadeLote> {
  const res = await fetch(
    `${API_BASE_URL}/api/lotes/${encodeURIComponent(codigoLote)}/rastreabilidade`,
    { cache: "no-store" }
  );
  return parseResponse<RastreabilidadeLote>(res);
}