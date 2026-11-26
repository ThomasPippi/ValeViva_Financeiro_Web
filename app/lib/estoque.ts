export type StatusQualidade =
  | "PENDENTE"
  | "QUARENTENA"
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

// o backend identifica o lote pelo número (loteId) e o usuário pelo id
export type EntradaEstoqueInput = {
  produtoId: number;
  loteId: number;
  quantidade: number;
  usuarioId: number;
  origemDestino?: string;
};

export type ExpedicaoInput = {
  produtoId: number;
  loteId: number;
  quantidade: number;
  destino: string;
  usuarioId: number;
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

type RastreabilidadeApiResponse = {
  lote?: {
    codigo?: string;
    produtoNome?: string;
    ordemOrigemId?: number | null;
    dataValidade?: string | null;
    statusQualidade?: string;
  };
  saldoAtual?: number;
  movimentacoes?: Array<{
    id: number;
    tipo: string;
    quantidade: string | number;
    dataHora: string;
    usuario: string;
    origemDestino?: string | null;
  }>;
};

// "/backend" é redirecionado para a API Spring no next.config.ts (evita erro de CORS)
const API_BASE_URL = "/backend";

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const texto = await res.text().catch(() => "");
    throw new Error(texto || `Erro HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function listarSaldosEstoque(): Promise<SaldoEstoqueItem[]> {
  const res = await fetch(`${API_BASE_URL}/estoque/saldos`, {
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
    ? `${API_BASE_URL}/estoque/movimentacoes?${qs}`
    : `${API_BASE_URL}/estoque/movimentacoes`;

  const res = await fetch(url, { cache: "no-store" });
  return parseResponse<MovimentacaoEstoque[]>(res);
}

export async function registrarEntradaEstoque(
  payload: EntradaEstoqueInput
): Promise<SaldoEstoqueItem | MovimentacaoEstoque> {
  const res = await fetch(`${API_BASE_URL}/estoque/entradas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<SaldoEstoqueItem | MovimentacaoEstoque>(res);
}

export async function registrarExpedicao(
  payload: ExpedicaoInput
): Promise<MovimentacaoEstoque | Record<string, unknown>> {
  const res = await fetch(`${API_BASE_URL}/expedicoes`, {
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
    `${API_BASE_URL}/lotes/${encodeURIComponent(codigoLote)}/rastreabilidade`,
    { cache: "no-store" }
  );
  const raw = await parseResponse<RastreabilidadeApiResponse>(res);

  return {
    codigoLote: raw.lote?.codigo ?? codigoLote,
    produtoDescricao: raw.lote?.produtoNome,
    ordemOrigem:
      raw.lote?.ordemOrigemId != null ? `OP #${raw.lote.ordemOrigemId}` : null,
    validade: raw.lote?.dataValidade ?? null,
    statusQualidade: raw.lote?.statusQualidade,
    saldoAtual: raw.saldoAtual,
    movimentacoes: (raw.movimentacoes ?? []).map((m) => ({
      id: m.id,
      tipo: m.tipo,
      codigoLote: raw.lote?.codigo ?? codigoLote,
      quantidade: Number(m.quantidade),
      dataHora: m.dataHora,
      usuario: m.usuario,
      origemDestino: m.origemDestino ?? null,
    })),
  };
}