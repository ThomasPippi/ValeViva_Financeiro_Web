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

// "/backend" é redirecionado para a API Spring no next.config.ts (evita erro de CORS)
const API_BASE_URL = "/backend";

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const texto = await res.text().catch(() => "");
    throw new Error(texto || `Erro HTTP ${res.status}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export async function listarOrdensProducao(
  status?: StatusOrdem | "TODAS"
): Promise<OrdemProducao[]> {
  const res = await fetch(`${API_BASE_URL}/ordens-producao`, { cache: "no-store" });
  const dados = await parseResponse<OrdemProducao[] | { content?: OrdemProducao[] }>(res);
  const ordens = Array.isArray(dados) ? dados : dados.content ?? [];
  // o backend não filtra por status, então filtra aqui
  if (status && status !== "TODAS") {
    return ordens.filter((ordem) => ordem.status === status);
  }
  return ordens;
}

export async function emitirOrdemProducao(
  payload: EmitirOrdemInput
): Promise<OrdemProducao> {
  const res = await fetch(`${API_BASE_URL}/ordens-producao`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<OrdemProducao>(res);
}

export async function atualizarOrdemProducao(
  id: number,
  payload: EmitirOrdemInput
): Promise<OrdemProducao> {
  const res = await fetch(`${API_BASE_URL}/ordens-producao/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<OrdemProducao>(res);
}

export async function excluirOrdemProducao(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/ordens-producao/${id}`, {
    method: "DELETE",
  });
  await parseResponse<void>(res);
}

export async function confirmarMateriaisOrdem(
  id: number
): Promise<OrdemProducao> {
  const res = await fetch(`${API_BASE_URL}/ordens-producao/${id}/confirmar-materiais`, {
    method: "POST",
  });
  return parseResponse<OrdemProducao>(res);
}