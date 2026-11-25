"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  consultarRastreabilidadeLote,
  listarSaldosEstoque,
  type RastreabilidadeLote,
  type SaldoEstoqueItem,
  type StatusQualidade,
} from "../../lib/estoque";

// "/backend" é redirecionado para a API Spring no next.config.ts (evita erro de CORS)
// TODO: endpoints de lote (qualidade) ainda não existem no backend
const API_BASE_URL = "/backend";

async function atualizarQualidadeLote(
  codigoLote: string,
  statusQualidade: Extract<StatusQualidade, "APROVADO" | "REPROVADO">,
  observacao?: string
): Promise<void> {
  const encoded = encodeURIComponent(codigoLote);
  const body = JSON.stringify({
    statusQualidade,
    status: statusQualidade,
    observacao: observacao?.trim() || undefined,
  });

  let res = await fetch(`${API_BASE_URL}/lotes/${encoded}/qualidade`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body,
  });

  if (res.status === 405 || res.status === 404) {
    res = await fetch(`${API_BASE_URL}/lotes/${encoded}/qualidade`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body,
    });
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
}

function formatarData(valor?: string | null): string {
  if (!valor) return "—";
  const d = new Date(`${valor.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return valor;
  return d.toLocaleDateString("pt-BR");
}

function formatarDataHora(valor?: string | null): string {
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

export default function LotesQualidadePage() {
  const [lotes, setLotes] = useState<SaldoEstoqueItem[]>([]);
  const [busca, setBusca] = useState("");
  const [observacao, setObservacao] = useState("");
  const [loading, setLoading] = useState(true);
  const [atualizandoCodigo, setAtualizandoCodigo] = useState<string | null>(
    null
  );

  const [codigoRastreio, setCodigoRastreio] = useState("");
  const [rastreio, setRastreio] = useState<RastreabilidadeLote | null>(null);
  const [buscandoRastreio, setBuscandoRastreio] = useState(false);

  const carregarLotes = useCallback(async () => {
    setLoading(true);
    try {
      const dados = await listarSaldosEstoque().catch(() => []);
      setLotes(dados);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarLotes();
  }, [carregarLotes]);

  async function handleQualidade(
    codigoLote: string,
    novoStatus: Extract<StatusQualidade, "APROVADO" | "REPROVADO">
  ) {
    setAtualizandoCodigo(codigoLote);
    try {
      await atualizarQualidadeLote(codigoLote, novoStatus, observacao);
      setLotes((prev) =>
        prev.map((item) =>
          item.codigoLote === codigoLote
            ? { ...item, statusQualidade: novoStatus }
            : item
        )
      );
      if (rastreio?.codigoLote === codigoLote) {
        setRastreio((prev) =>
          prev ? { ...prev, statusQualidade: novoStatus } : prev
        );
      }
    } catch {
      // Silenciado sem banner de erro
    } finally {
      setAtualizandoCodigo(null);
    }
  }

  async function handleRastrear(e: FormEvent) {
    e.preventDefault();
    if (!codigoRastreio.trim()) return;
    setBuscandoRastreio(true);
    try {
      const dados = await consultarRastreabilidadeLote(codigoRastreio.trim());
      setRastreio(dados);
    } catch {
      setRastreio(null);
    } finally {
      setBuscandoRastreio(false);
    }
  }

  async function abrirRastreioDoLote(codigoLote: string) {
    setCodigoRastreio(codigoLote);
    setBuscandoRastreio(true);
    try {
      const dados = await consultarRastreabilidadeLote(codigoLote);
      setRastreio(dados);
    } catch {
      setRastreio(null);
    } finally {
      setBuscandoRastreio(false);
    }
  }

  const termo = busca.trim().toLowerCase();
  const lotesFiltrados = lotes.filter((item) => {
    if (!termo) return true;
    return (
      item.codigoLote.toLowerCase().includes(termo) ||
      (item.codigoProduto ?? "").toLowerCase().includes(termo) ||
      (item.descricaoProduto ?? "").toLowerCase().includes(termo) ||
      (item.statusQualidade ?? "").toLowerCase().includes(termo)
    );
  });

  return (
    <section style={{ padding: 24, maxWidth: 1180, margin: "0 auto" }}>
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
          <h1 style={{ margin: 0, fontSize: 24 }}>Qualidade de lotes</h1>
          <p style={{ margin: "4px 0 0", opacity: 0.75, fontSize: 14 }}>
            Aprovação ou reprovação de qualidade e rastreabilidade por lote
            (RN06 / RN07)
          </p>
        </div>

        <button
          type="button"
          onClick={carregarLotes}
          disabled={loading}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid currentColor",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          {loading ? "Atualizando..." : "Atualizar lotes"}
        </button>
      </header>

      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <input
          type="search"
          placeholder="Buscar por lote, produto ou qualidade..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid rgba(128, 128, 128, 0.35)",
            background: "transparent",
            color: "inherit",
            minWidth: 260,
          }}
        />
        <input
          type="text"
          placeholder="Observação da inspeção (opcional)"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid rgba(128, 128, 128, 0.35)",
            background: "transparent",
            color: "inherit",
            minWidth: 280,
          }}
        />
      </div>

      {loading ? (
        <p>Carregando lotes...</p>
      ) : lotesFiltrados.length === 0 ? (
        <p style={{ opacity: 0.75 }}>Nenhum lote encontrado.</p>
      ) : (
        <div style={{ overflowX: "auto", marginBottom: 28 }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid rgba(128, 128, 128, 0.3)",
                  textAlign: "left",
                }}
              >
                <th style={{ padding: "10px 8px" }}>Código do lote</th>
                <th style={{ padding: "10px 8px" }}>Produto</th>
                <th style={{ padding: "10px 8px" }}>Quantidade</th>
                <th style={{ padding: "10px 8px" }}>Validade</th>
                <th style={{ padding: "10px 8px" }}>Qualidade</th>
                <th style={{ padding: "10px 8px" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {lotesFiltrados.map((item, idx) => {
                const emAndamento = atualizandoCodigo === item.codigoLote;
                return (
                  <tr
                    key={item.id ?? `${item.codigoLote}-${idx}`}
                    style={{
                      borderBottom: "1px solid rgba(128, 128, 128, 0.15)",
                    }}
                  >
                    <td style={{ padding: "10px 8px", fontWeight: 600 }}>
                      {item.codigoLote}
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      {item.codigoProduto
                        ? `${item.codigoProduto} — ${item.descricaoProduto ?? ""}`
                        : item.descricaoProduto ?? "—"}
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      {item.quantidade} {item.unidade ?? ""}
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      {formatarData(item.validade)}
                    </td>
                    <td style={{ padding: "10px 8px", fontWeight: 600 }}>
                      {item.statusQualidade ?? "PENDENTE"}
                    </td>
                    <td
                      style={{
                        padding: "10px 8px",
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        type="button"
                        disabled={emAndamento}
                        onClick={() =>
                          handleQualidade(item.codigoLote, "APROVADO")
                        }
                        style={{
                          padding: "6px 10px",
                          borderRadius: 6,
                          border: "1px solid #16a34a",
                          color: "#16a34a",
                          background: "transparent",
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        Aprovar
                      </button>
                      <button
                        type="button"
                        disabled={emAndamento}
                        onClick={() =>
                          handleQualidade(item.codigoLote, "REPROVADO")
                        }
                        style={{
                          padding: "6px 10px",
                          borderRadius: 6,
                          border: "1px solid #ef4444",
                          color: "#ef4444",
                          background: "transparent",
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        Reprovar
                      </button>
                      <button
                        type="button"
                        onClick={() => abrirRastreioDoLote(item.codigoLote)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 6,
                          border: "1px solid currentColor",
                          background: "transparent",
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        Rastreabilidade
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Bloco de rastreabilidade do lote */}
      <div
        style={{
          padding: 16,
          borderRadius: 12,
          border: "1px solid rgba(128, 128, 128, 0.25)",
        }}
      >
        <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>
          Rastreabilidade do lote
        </h2>

        <form
          onSubmit={handleRastrear}
          style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}
        >
          <input
            type="text"
            placeholder="Código do lote"
            value={codigoRastreio}
            onChange={(e) => setCodigoRastreio(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid rgba(128, 128, 128, 0.35)",
              background: "transparent",
              color: "inherit",
              minWidth: 240,
            }}
          />
          <button
            type="submit"
            disabled={buscandoRastreio}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid currentColor",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            {buscandoRastreio ? "Consultando..." : "Consultar lote"}
          </button>
        </form>

        {rastreio && (
          <div style={{ display: "grid", gap: 8, fontSize: 14 }}>
            <div>
              <strong>Lote:</strong> {rastreio.codigoLote} |{" "}
              <strong>Ordem de origem:</strong> {rastreio.ordemOrigem ?? "—"} |{" "}
              <strong>Qualidade:</strong> {rastreio.statusQualidade ?? "—"} |{" "}
              <strong>Validade:</strong> {formatarData(rastreio.validade)}
            </div>
            {rastreio.destinos && rastreio.destinos.length > 0 && (
              <div>
                <strong>Destinos expedidos:</strong>{" "}
                {rastreio.destinos.join(", ")}
              </div>
            )}
            {rastreio.movimentacoes && rastreio.movimentacoes.length > 0 && (
              <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
                {rastreio.movimentacoes.map((m) => (
                  <li key={m.id}>
                    [{formatarDataHora(m.dataHora)}] {m.tipo} — {m.quantidade}{" "}
                    ({m.usuario})
                    {m.origemDestino ? ` • ${m.origemDestino}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}