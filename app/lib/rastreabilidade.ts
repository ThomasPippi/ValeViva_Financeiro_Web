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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export async function buscarRastreabilidadeLote(
  codigoLote: string
): Promise<RastreabilidadeLote> {
  const res = await fetch(
    `${API_BASE_URL}/api/lotes/${encodeURIComponent(codigoLote)}/rastreabilidade`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json() as Promise<RastreabilidadeLote>;
}