export type Notificacao = {
  id: number;
  titulo: string;
  mensagem: string;
  dataEnvio: string;
  lida: boolean;
};

export type CriarNotificacaoInput = {
  titulo: string;
  mensagem: string;
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

export async function listarNotificacoes(): Promise<Notificacao[]> {
  const res = await fetch(`${API_BASE_URL}/notificacoes`, {
    cache: "no-store",
  });
  return parseResponse<Notificacao[]>(res);
}

export async function criarNotificacao(
  payload: CriarNotificacaoInput
): Promise<Notificacao> {
  const res = await fetch(`${API_BASE_URL}/notificacoes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<Notificacao>(res);
}

export async function marcarNotificacaoComoLida(
  id: number
): Promise<Notificacao> {
  const res = await fetch(`${API_BASE_URL}/notificacoes/${id}/ler`, {
    method: "PUT",
  });
  return parseResponse<Notificacao>(res);
}