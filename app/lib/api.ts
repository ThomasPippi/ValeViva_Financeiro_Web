// Utilitários compartilhados pelas chamadas da API.

/**
 * Lança um Error com a mensagem que o backend mandou no corpo da resposta
 * (ex.: "Só é possível alterar pedidos em aberto.") ou, sem corpo, com `padrao`.
 */
export async function falharComMensagem(resposta: Response, padrao: string): Promise<never> {
  let mensagem = "";
  try {
    mensagem = (await resposta.text()).trim();
  } catch {}
  // respostas de erro padrão do Spring vêm em JSON; aí a mensagem genérica é melhor
  if (!mensagem || mensagem.startsWith("{") || mensagem.startsWith("<")) mensagem = padrao;
  throw new Error(mensagem);
}

/** Mensagem de um erro capturado no catch, com fallback. */
export function mensagemDeErro(erro: unknown, padrao: string) {
  return erro instanceof Error && erro.message ? erro.message : padrao;
}
