// Produtos/insumos do backend Spring (ValeViva_Financeiro).
// Usa o proxy "/backend" do next.config.ts para não dar erro de CORS.

export type TipoProduto = "MATERIA_PRIMA" | "COMPONENTE" | "PRODUTO_FINAL";

export type Produto = {
  id: number;
  nome: string;
  codigo: string;
  descricao: string;
  tipo: TipoProduto;
  unidade: string;
  preco: number;
  quantidade_estoque: number;
  estoque_minimo: number;
  registro_anvisa: string | null;
  vencimento_anvisa: string | null;
  is_ativo: boolean;
};

export type CriarProdutoInput = Omit<Produto, "id">;

export async function listarProdutos(tipo?: TipoProduto): Promise<Produto[]> {
  // o backend devolve paginado, então pede uma página grande pra vir tudo
  const res = await fetch("/backend/produtos?size=1000", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Erro HTTP ${res.status}`);
  }
  const dados = await res.json();
  const produtos: Produto[] = Array.isArray(dados) ? dados : dados.content ?? [];

  // o backend não filtra por tipo, então filtra aqui
  if (tipo) {
    return produtos.filter((p) => p.tipo === tipo);
  }
  return produtos;
}

export async function criarProduto(payload: CriarProdutoInput): Promise<void> {
  const res = await fetch("/backend/produtos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const texto = await res.text().catch(() => "");
    throw new Error(texto || `Erro HTTP ${res.status}`);
  }
}

export async function atualizarProduto(
  id: number,
  payload: CriarProdutoInput
): Promise<void> {
  const res = await fetch(`/backend/produtos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const texto = await res.text().catch(() => "");
    throw new Error(texto || `Erro HTTP ${res.status}`);
  }
}

export async function excluirProduto(id: number): Promise<void> {
  const res = await fetch(`/backend/produtos/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const texto = await res.text().catch(() => "");
    throw new Error(texto || `Erro HTTP ${res.status}`);
  }
}
