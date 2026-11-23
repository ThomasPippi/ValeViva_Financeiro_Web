export type TipoProduto = "MATERIA_PRIMA" | "COMPONENTE" | "ACABADO";

export type Produto = {
  id: number;
  codigo: string;
  descricao: string;
  unidade: string;
  tipo: TipoProduto;
  precoVenda: number;
  estoqueMinimo: number;
  registroAnvisa: string | null;
  validadeRegistro: string | null;
};

export type CriarProdutoInput = {
  codigo: string;
  descricao: string;
  unidade: string;
  tipo: TipoProduto;
  precoVenda: number;
  estoqueMinimo: number;
  registroAnvisa?: string;
  validadeRegistro?: string;
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

export async function listarProdutos(tipo?: TipoProduto): Promise<Produto[]> {
  const url = tipo
    ? `${API_BASE_URL}/api/produtos?tipo=${encodeURIComponent(tipo)}`
    : `${API_BASE_URL}/api/produtos`;
  const res = await fetch(url, { cache: "no-store" });
  return parseResponse<Produto[]>(res);
}

export async function criarProduto(
  payload: CriarProdutoInput
): Promise<Produto> {
  const res = await fetch(`${API_BASE_URL}/api/produtos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<Produto>(res);
}