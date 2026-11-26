export type MovimentacaoRastreio = {
  id: number;
  tipo: string;
  codigoLote: string;
  quantidade: number;
  dataHora: string;
  usuario: string;
  origemDestino?: string | null;
};

export type RastreabilidadeLote = {
  codigoLote: string;
  produtoCodigo?: string;
  produtoDescricao?: string;
  ordemOrigem?: string | null;
  validade?: string | null;
  statusQualidade?: string;
  saldoAtual?: number;
  movimentacoes?: MovimentacaoRastreio[];
  destinos?: string[];
};

// "/backend" é redirecionado para a API Spring no next.config.ts (evita erro de CORS)
const API_BASE_URL = "/backend";

export async function buscarRastreabilidadeLote(
  codigoLote: string
): Promise<RastreabilidadeLote> {
  const res = await fetch(
    `${API_BASE_URL}/lotes/${encodeURIComponent(codigoLote)}/rastreabilidade`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json() as Promise<RastreabilidadeLote>;
}