// Chamadas da API de pedidos de compra
//   GET    /pedidos-compra                  -> lista paginada (Page)
//   GET    /pedidos-compra/{id}             -> um pedido
//   POST   /pedidos-compra                  -> cria pedido
//   PUT    /pedidos-compra/{id}             -> altera pedido (só ABERTO; substitui os itens)
//   DELETE /pedidos-compra/{id}             -> exclui pedido (qualquer status)
//   PUT    /pedidos-compra/{id}/recebimento -> registra o recebimento

import { falharComMensagem } from "./api";

export type StatusPedido = "ABERTO" | "RECEBIDO" | "CANCELADO";

export type ItemPedido = {
  id: number;
  produto_id: number;
  produto_nome: string;
  quantidade: number;
  preco_unitario: number;
  quantidade_recebida: number | null;
};

export type PedidoCompra = {
  id: number;
  fornecedor_id: number;
  fornecedor_nome: string;
  data_pedido: string; // yyyy-mm-dd
  data_prometida: string;
  data_recebimento: string | null;
  status: StatusPedido;
  itens: ItemPedido[];
};

export type NovoPedido = {
  fornecedor_id: number;
  data_pedido: string;
  data_prometida: string;
  itens: {
    produto_id: number;
    quantidade: number;
    preco_unitario: number;
  }[];
};

export type Recebimento = {
  data_recebimento: string;
  itens: {
    item_id: number;
    quantidade_recebida: number;
  }[];
};

export async function buscarPedidos(): Promise<PedidoCompra[]> {
  const resposta = await fetch("/backend/pedidos-compra?size=1000");
  if (!resposta.ok) {
    throw new Error("Não foi possível carregar os pedidos");
  }
  const dados = await resposta.json();
  return dados.content;
}

export async function buscarPedido(id: string): Promise<PedidoCompra> {
  const resposta = await fetch(`/backend/pedidos-compra/${id}`);
  if (!resposta.ok) {
    throw new Error("Pedido não encontrado");
  }
  return resposta.json();
}

export async function cadastrarPedido(pedido: NovoPedido) {
  const resposta = await fetch("/backend/pedidos-compra", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pedido),
  });
  if (!resposta.ok) {
    throw new Error("Erro ao cadastrar o pedido");
  }
}

export async function atualizarPedido(id: number | string, pedido: NovoPedido) {
  const resposta = await fetch(`/backend/pedidos-compra/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pedido),
  });
  if (!resposta.ok) {
    await falharComMensagem(resposta, "Erro ao atualizar o pedido");
  }
}

export async function excluirPedido(id: number) {
  const resposta = await fetch(`/backend/pedidos-compra/${id}`, { method: "DELETE" });
  if (!resposta.ok) {
    await falharComMensagem(resposta, "Erro ao excluir o pedido");
  }
}

export async function registrarRecebimento(id: string, recebimento: Recebimento) {
  const resposta = await fetch(`/backend/pedidos-compra/${id}/recebimento`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(recebimento),
  });
  if (!resposta.ok) {
    throw new Error("Erro ao registrar o recebimento");
  }
}

export function hojeISO() {
  // data local no formato yyyy-mm-dd
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function estaAtrasado(pedido: PedidoCompra) {
  return pedido.status === "ABERTO" && pedido.data_prometida < hojeISO();
}

export function totalPedido(pedido: PedidoCompra) {
  let total = 0;
  for (const item of pedido.itens) {
    total += item.quantidade * item.preco_unitario;
  }
  return total;
}
