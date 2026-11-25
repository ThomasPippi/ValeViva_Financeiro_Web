export type StatusOrdem =
  | "EMITIDA"
  | "AGUARDANDO_MATERIAIS"
  | "LIBERADA"
  | "EM_PRODUCAO"
  | "CONCLUIDA"
  | "CANCELADA";

export type ItemNecessidade = {
  materialId?: number;
  codigoMaterial?: string;
  descricaoMaterial?: string;
  necessario: number;
  disponivel: number;
  falta: number;
};

export type OrdemProducao = {
  id: number;
  numero?: string;
  produtoId?: number;
  codigoProduto?: string;
  descricaoProduto?: string;
  quantidade: number;
  prazo: string;
  prioridade: number;
  status: StatusOrdem | string;
  emitidaEm?: string;
  faltas?: ItemNecessidade[];
};

export type EmitirOrdemInput = {
  produtoId: number;
  quantidade: number;
  prazo: string;
  prioridade: number;
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

export async function listarOrdensProducao(
  status?: StatusOrdem | "TODAS"
): Promise<OrdemProducao[]> {
  const url =
    status && status !== "TODAS"
      ? `${API_BASE_URL}/api/ordens?status=${encodeURIComponent(status)}`
      : `${API_BASE_URL}/api/ordens`;
  const res = await fetch(url, { cache: "no-store" });
  return parseResponse<OrdemProducao[]>(res);
}

export async function emitirOrdemProducao(
  payload: EmitirOrdemInput
): Promise<OrdemProducao> {
  const res = await fetch(`${API_BASE_URL}/api/ordens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<OrdemProducao>(res);
}

export async function confirmarMateriaisOrdem(
  id: number
): Promise<OrdemProducao> {
  const res = await fetch(
    `${API_BASE_URL}/api/ordens/${id}/confirmar-materiais`,
    {
      method: "POST",
    }
  );
  return parseResponse<OrdemProducao>(res);
}