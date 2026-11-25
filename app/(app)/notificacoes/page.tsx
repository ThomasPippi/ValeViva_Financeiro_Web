"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export type Notificacao = {
  id: number;
  tipo?: string;
  titulo?: string;
  mensagem: string;
  lida: boolean;
  dataHora?: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function buscarNotificacoes(
  filtro: "todas" | "nao-lidas"
): Promise<Notificacao[]> {
  const url =
    filtro === "nao-lidas"
      ? `${API_BASE_URL}/api/notificacoes?lida=false`
      : `${API_BASE_URL}/api/notificacoes`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json() as Promise<Notificacao[]>;
}

async function marcarComoLida(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/notificacoes/${id}/lida`, {
    method: "PATCH",
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
}

function formatarDataHora(valor?: string): string {
  if (!valor) return "—";
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return valor;
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function NotificacoesConteudo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filtro: "todas" | "nao-lidas" =
    searchParams.get("filtro") === "nao-lidas" ? "nao-lidas" : "todas";

  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [marcandoId, setMarcandoId] = useState<number | null>(null);

  function alternarFiltro(novoFiltro: "todas" | "nao-lidas") {
    router.replace(`/notificacoes?filtro=${novoFiltro}`, { scroll: false });
  }

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const dados = await buscarNotificacoes(filtro).catch(() => []);
      setNotificacoes(dados);
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function handleMarcarLida(id: number) {
    setMarcandoId(id);
    try {
      await marcarComoLida(id);
      setNotificacoes((prev) =>
        filtro === "nao-lidas"
          ? prev.filter((item) => item.id !== id)
          : prev.map((item) => (item.id === id ? { ...item, lida: true } : item))
      );
    } catch {
      // Silenciado sem banner de erro
    } finally {
      setMarcandoId(null);
    }
  }

  const itensVisiveis =
    filtro === "nao-lidas"
      ? notificacoes.filter((item) => !item.lida)
      : notificacoes;

  return (
    <section style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>
            {filtro === "nao-lidas"
              ? "Alertas não lidos"
              : "Todas as notificações"}
          </h1>
          <p style={{ margin: "4px 0 0", opacity: 0.75, fontSize: 14 }}>
            Alertas de estoque mínimo, validade de lote/ANVISA, ordens e
            financeiro
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => alternarFiltro("todas")}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid currentColor",
              background: "transparent",
              fontWeight: filtro === "todas" ? 700 : 400,
              cursor: "pointer",
            }}
          >
            Todas as notificações
          </button>
          <button
            type="button"
            onClick={() => alternarFiltro("nao-lidas")}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid currentColor",
              background: "transparent",
              fontWeight: filtro === "nao-lidas" ? 700 : 400,
              cursor: "pointer",
            }}
          >
            Alertas não lidos
          </button>
          <button
            type="button"
            onClick={carregar}
            disabled={loading}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid currentColor",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            {loading ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
      </header>

      {loading ? (
        <p>Carregando notificações...</p>
      ) : itensVisiveis.length === 0 ? (
        <p style={{ opacity: 0.75 }}>Nenhuma notificação encontrada.</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {itensVisiveis.map((item) => (
            <article
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                padding: 14,
                borderRadius: 10,
                border: "1px solid rgba(128, 128, 128, 0.25)",
                opacity: item.lida ? 0.7 : 1,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "grid", gap: 4 }}>
                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  <strong>{item.tipo ?? "ALERTA"}</strong> •{" "}
                  {formatarDataHora(item.dataHora)} •{" "}
                  {item.lida ? "Lida" : "Não lida"}
                </div>
                {item.titulo && <strong>{item.titulo}</strong>}
                <p style={{ margin: 0, fontSize: 14 }}>{item.mensagem}</p>
              </div>

              {!item.lida && (
                <button
                  type="button"
                  disabled={marcandoId === item.id}
                  onClick={() => handleMarcarLida(item.id)}
                  style={{
                    padding: "7px 12px",
                    borderRadius: 8,
                    border: "1px solid currentColor",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  {marcandoId === item.id ? "Salvando..." : "Marcar como lida"}
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function NotificacoesPage() {
  return (
    <Suspense fallback={<p style={{ padding: 24 }}>Carregando...</p>}>
      <NotificacoesConteudo />
    </Suspense>
  );
}