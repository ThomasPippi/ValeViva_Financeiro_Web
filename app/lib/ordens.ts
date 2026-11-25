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
  return res.json() as Promise<T>;
}

export async function listarOrdensProducao(
  status?: StatusOrdem | "TODAS"
): Promise<OrdemProducao[]> {
  const res = await fetch(`${API_BASE_URL}/ordens-producao`, { cache: "no-store" });
  const ordens = await parseResponse<OrdemProducao[]>(res);
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

export async function confirmarMateriaisOrdem(
  id: number
): Promise<OrdemProducao> {
  const res = await fetch(
    // TODO: endpoint ainda não existe no backend (precisa da lista de materiais do produto)
    `${API_BASE_URL}/ordens-producao/${id}/confirmar-materiais`,
    {
      method: "POST",
    }
  );
  return parseResponse<OrdemProducao>(res);
}