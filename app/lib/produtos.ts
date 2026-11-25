// Chamadas da API de produtos (backend Spring em ValeViva_Financeiro).
// O "/backend" é redirecionado para o localhost:8080 no next.config.ts

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

export type NovoProduto = Omit<Produto, "id">;

export const nomesTipo = {
  MATERIA_PRIMA: "Matéria-prima",
  COMPONENTE: "Componente",
  PRODUTO_FINAL: "Produto final",
};

export async function buscarProdutos(): Promise<Produto[]> {
  // o backend devolve paginado, então pede uma página grande pra vir tudo
  const resposta = await fetch("/backend/produtos?size=1000");
  if (!resposta.ok) {
    throw new Error("Não foi possível carregar os produtos");
  }
  const dados = await resposta.json();
  return dados.content;
}

export async function cadastrarProduto(produto: NovoProduto) {
  const resposta = await fetch("/backend/produtos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(produto),
  });
  if (!resposta.ok) {
    throw new Error("Erro ao cadastrar o produto");
  }
}
