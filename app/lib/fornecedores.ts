// Chamadas da API de fornecedores

import { falharComMensagem } from "./api";

export type Fornecedor = {
  id: number;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  email: string;
  telefone: string;
  prazo_entrega_dias: number;
  is_ativo: boolean;
};

export type NovoFornecedor = Omit<Fornecedor, "id">;

export async function buscarFornecedores(): Promise<Fornecedor[]> {
  const resposta = await fetch("/backend/fornecedor?size=1000");
  if (!resposta.ok) {
    throw new Error("Não foi possível carregar os fornecedores");
  }
  const dados = await resposta.json();
  return dados.content;
}

export async function cadastrarFornecedor(fornecedor: NovoFornecedor) {
  const resposta = await fetch("/backend/fornecedor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fornecedor),
  });
  if (!resposta.ok) {
    throw new Error("Erro ao cadastrar o fornecedor");
  }
}

export async function atualizarFornecedor(id: number, fornecedor: NovoFornecedor) {
  const resposta = await fetch(`/backend/fornecedor/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fornecedor),
  });
  if (!resposta.ok) {
    await falharComMensagem(resposta, "Erro ao atualizar o fornecedor");
  }
}

// O backend apaga junto os pedidos de compra do fornecedor.
export async function excluirFornecedor(id: number) {
  const resposta = await fetch(`/backend/fornecedor/${id}`, { method: "DELETE" });
  if (!resposta.ok) {
    await falharComMensagem(resposta, "Erro ao excluir o fornecedor");
  }
}
