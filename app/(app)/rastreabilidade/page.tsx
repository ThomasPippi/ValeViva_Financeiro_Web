"use client";

import { FormEvent, useState } from "react";
import {
  buscarRastreabilidadeLote,
  type RastreabilidadeLote,
} from "../../lib/rastreabilidade";

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

export default function RastreabilidadeLotePage() {
  const [codigo, setCodigo] = useState("");
  const [rastreio, setRastreio] = useState<RastreabilidadeLote | null>(null);
  const [buscando, setBuscando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const limpo = codigo.trim();
    if (!limpo) return;

    setBuscando(true);
    try {
      const dados = await buscarRastreabilidadeLote(limpo);
      setRastreio(dados);
    } catch {
      setRastreio(null);
    } finally {
      setBuscando(false);
    }
  }

  return (
    <section style={{ padding: 24, maxWidth: 1080, margin: "0 auto" }}>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>Rastreabilidade do lote</h1>
        <p style={{ margin: "4px 0 0", opacity: 0.75, fontSize: 14 }}>
          Origem, qualidade, validade, movimentações e destinos expedidos (RN07)
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Código do lote"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          style={{
            padding: "9px 12px",
            borderRadius: 8,
            border: "1px solid rgba(128, 128, 128, 0.35)",
            background: "transparent",
            color: "inherit",
            minWidth: 260,
          }}
        />
        <button
          type="submit"
          disabled={buscando}
          style={{
            padding: "9px 16px",
            borderRadius: 8,
            border: "none",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {buscando ? "Consultando..." : "Consultar lote"}
        </button>
      </form>

      {rastreio ? (
        <div
          style={{
            padding: 18,
            borderRadius: 12,
            border: "1px solid rgba(128, 128, 128, 0.25)",
            display: "grid",
            gap: 12,
            fontSize: 14,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
            }}
          >
            <div>
              <strong>Lote:</strong> {rastreio.codigoLote}
            </div>
            <div>
              <strong>Produto:</strong>{" "}
              {rastreio.produtoCodigo
                ? `${rastreio.produtoCodigo} — ${rastreio.produtoDescricao ?? ""}`
                : rastreio.produtoDescricao ?? "—"}
            </div>
            <div>
              <strong>Ordem de origem:</strong> {rastreio.ordemOrigem ?? "—"}
            </div>
            <div>
              <strong>Qualidade:</strong> {rastreio.statusQualidade ?? "—"}
            </div>
            <div>
              <strong>Validade:</strong> {formatarData(rastreio.validade)}
            </div>
            <div>
              <strong>Saldo atual:</strong> {rastreio.saldoAtual ?? "—"}
            </div>
          </div>

          {rastreio.destinos && rastreio.destinos.length > 0 && (
            <div>
              <strong>Destinos expedidos:</strong>{" "}
              {rastreio.destinos.join(", ")}
            </div>
          )}

          {rastreio.movimentacoes && rastreio.movimentacoes.length > 0 && (
            <div>
              <strong>Histórico de movimentações</strong>
              <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                {rastreio.movimentacoes.map((m) => (
                  <li key={m.id}>
                    [{formatarDataHora(m.dataHora)}] {m.tipo} — {m.quantidade}{" "}
                    ({m.usuario})
                    {m.origemDestino ? ` • ${m.origemDestino}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <p style={{ opacity: 0.75 }}>
          Digite um código de lote para consultar a rastreabilidade.
        </p>
      )}
    </section>
  );
}