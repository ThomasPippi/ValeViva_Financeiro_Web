"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  consultarRastreabilidadeLote,
  listarMovimentacoesEstoque,
  listarSaldosEstoque,
  registrarEntradaEstoque,
  registrarExpedicao,
  type MovimentacaoEstoque,
  type RastreabilidadeLote,
  type SaldoEstoqueItem,
  type StatusQualidade,
} from "../../../lib/estoque";

function isLoteVencido(validade?: string | null): boolean {
  if (!validade) return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataValidade = new Date(`${validade.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(dataValidade.getTime())) return false;
  return dataValidade < hoje;
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

export default function EstoqueELotesPage() {
  const [saldos, setSaldos] = useState<SaldoEstoqueItem[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
  const [buscaLote, setBuscaLote] = useState("");
  const [filtroPeriodoInicio, setFiltroPeriodoInicio] = useState("");
  const [filtroPeriodoFim, setFiltroPeriodoFim] = useState("");
  const [filtroProdutoMov, setFiltroProdutoMov] = useState("");

  const [loading, setLoading] = useState(true);

  const [entradaLote, setEntradaLote] = useState("");
  const [entradaQtd, setEntradaQtd] = useState("");
  const [entradaUsuario, setEntradaUsuario] = useState("");
  const [entradaOrigem, setEntradaOrigem] = useState("");
  const [entradaValidade, setEntradaValidade] = useState("");
  const [entradaQualidade, setEntradaQualidade] =
    useState<StatusQualidade>("PENDENTE");
  const [salvandoEntrada, setSalvandoEntrada] = useState(false);

  const [saidaLote, setSaidaLote] = useState("");
  const [saidaQtd, setSaidaQtd] = useState("");
  const [saidaDestino, setSaidaDestino] = useState("");
  const [saidaUsuario, setSaidaUsuario] = useState("");
  const [salvandoSaida, setSalvandoSaida] = useState(false);

  const [codigoRastreio, setCodigoRastreio] = useState("");
  const [rastreio, setRastreio] = useState<RastreabilidadeLote | null>(null);
  const [buscandoRastreio, setBuscandoRastreio] = useState(false);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const [dadosSaldos, dadosMov] = await Promise.all([
        listarSaldosEstoque().catch(() => []),
        listarMovimentacoesEstoque({
          inicio: filtroPeriodoInicio || undefined,
          fim: filtroPeriodoFim || undefined,
          produto: filtroProdutoMov.trim() || undefined,
        }).catch(() => []),
      ]);
      setSaldos(dadosSaldos);
      setMovimentacoes(dadosMov);
    } finally {
      setLoading(false);
    }
  }, [filtroPeriodoInicio, filtroPeriodoFim, filtroProdutoMov]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  async function handleEntrada(e: FormEvent) {
    e.preventDefault();

    const qtdNum = Number(entradaQtd.replace(",", "."));
    if (!entradaLote.trim() || !entradaUsuario.trim()) return;
    if (Number.isNaN(qtdNum) || qtdNum <= 0) return;

    setSalvandoEntrada(true);
    try {
      await registrarEntradaEstoque({
        codigoLote: entradaLote.trim(),
        quantidade: qtdNum,
        usuario: entradaUsuario.trim(),
        origemDestino: entradaOrigem.trim() || undefined,
        validade: entradaValidade || undefined,
        statusQualidade: entradaQualidade,
      });
      setEntradaLote("");
      setEntradaQtd("");
      setEntradaOrigem("");
      setEntradaValidade("");
      await carregarDados();
    } catch {
      // Silenciado sem banner de erro
    } finally {
      setSalvandoEntrada(false);
    }
  }

  async function handleExpedicao(e: FormEvent) {
    e.preventDefault();

    const qtdNum = Number(saidaQtd.replace(",", "."));
    if (!saidaLote.trim() || !saidaUsuario.trim() || !saidaDestino.trim()) return;
    if (Number.isNaN(qtdNum) || qtdNum <= 0) return;

    setSalvandoSaida(true);
    try {
      await registrarExpedicao({
        codigoLote: saidaLote.trim(),
        quantidade: qtdNum,
        destino: saidaDestino.trim(),
        usuario: saidaUsuario.trim(),
      });
      setSaidaLote("");
      setSaidaQtd("");
      setSaidaDestino("");
      await carregarDados();
    } catch {
      // Silenciado sem banner de erro
    } finally {
      setSalvandoSaida(false);
    }
  }

  async function handleRastrear(e: FormEvent) {
    e.preventDefault();
    if (!codigoRastreio.trim()) return;

    setBuscandoRastreio(true);
    try {
      const resultado = await consultarRastreabilidadeLote(
        codigoRastreio.trim()
      );
      setRastreio(resultado);
    } catch {
      setRastreio(null);
    } finally {
      setBuscandoRastreio(false);
    }
  }

  const termoLote = buscaLote.trim().toLowerCase();
  const saldosFiltrados = saldos.filter((item) => {
    if (!termoLote) return true;
    return (
      item.codigoLote.toLowerCase().includes(termoLote) ||
      (item.codigoProduto ?? "").toLowerCase().includes(termoLote) ||
      (item.descricaoProduto ?? "").toLowerCase().includes(termoLote)
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
          <h1 style={{ margin: 0, fontSize: 24 }}>Estoque e lotes</h1>
          <p style={{ margin: "4px 0 0", opacity: 0.75, fontSize: 14 }}>
            Saldos por lote, leitura de entrada/expedição, conformidade ANVISA
            e rastreabilidade (RF22, RF23, RN06, RN07, RN14, RN16)
          </p>
        </div>

        <button
          type="button"
          onClick={carregarDados}
          disabled={loading}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid currentColor",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          {loading ? "Atualizando..." : "Atualizar dados"}
        </button>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <form
          onSubmit={handleEntrada}
          style={{
            display: "grid",
            gap: 10,
            padding: 16,
            borderRadius: 12,
            border: "1px solid rgba(128, 128, 128, 0.25)",
          }}
        >
          <strong>Entrada em estoque (leitura de lote)</strong>
          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            Código do lote (obrigatório)
            <input
              type="text"
              placeholder="Bipar ou digitar código do lote"
              value={entradaLote}
              onChange={(e) => setEntradaLote(e.target.value)}
              style={{
                padding: "9px 12px",
                borderRadius: 8,
                border: "1px solid rgba(128, 128, 128, 0.35)",
                background: "transparent",
                color: "inherit",
              }}
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
              Quantidade
              <input
                type="text"
                inputMode="decimal"
                placeholder="Ex.: 500"
                value={entradaQtd}
                onChange={(e) => setEntradaQtd(e.target.value)}
                style={{
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(128, 128, 128, 0.35)",
                  background: "transparent",
                  color: "inherit",
                }}
              />
            </label>

            <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
              Usuário (obrigatório)
              <input
                type="text"
                placeholder="Operador / responsável"
                value={entradaUsuario}
                onChange={(e) => setEntradaUsuario(e.target.value)}
                style={{
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(128, 128, 128, 0.35)",
                  background: "transparent",
                  color: "inherit",
                }}
              />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
              Validade do lote
              <input
                type="date"
                value={entradaValidade}
                onChange={(e) => setEntradaValidade(e.target.value)}
                style={{
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(128, 128, 128, 0.35)",
                  background: "transparent",
                  color: "inherit",
                }}
              />
            </label>

            <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
              Status qualidade inicial
              <select
                value={entradaQualidade}
                onChange={(e) =>
                  setEntradaQualidade(e.target.value as StatusQualidade)
                }
                style={{
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(128, 128, 128, 0.35)",
                  background: "transparent",
                  color: "inherit",
                }}
              >
                <option value="PENDENTE">PENDENTE</option>
                <option value="APROVADO">APROVADO</option>
                <option value="REPROVADO">REPROVADO</option>
                <option value="BLOQUEADO">BLOQUEADO</option>
              </select>
            </label>
          </div>

          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            Origem / Fornecedor / Ordem
            <input
              type="text"
              placeholder="Ex.: Pedido #102 ou OP-2026-01"
              value={entradaOrigem}
              onChange={(e) => setEntradaOrigem(e.target.value)}
              style={{
                padding: "9px 12px",
                borderRadius: 8,
                border: "1px solid rgba(128, 128, 128, 0.35)",
                background: "transparent",
                color: "inherit",
              }}
            />
          </label>

          <button
            type="submit"
            disabled={salvandoEntrada}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              fontWeight: 600,
              cursor: "pointer",
              marginTop: 4,
            }}
          >
            {salvandoEntrada ? "Registrando entrada..." : "Registrar entrada"}
          </button>
        </form>

        <form
          onSubmit={handleExpedicao}
          style={{
            display: "grid",
            gap: 10,
            padding: 16,
            borderRadius: 12,
            border: "1px solid rgba(128, 128, 128, 0.25)",
          }}
        >
          <strong>Expedição / Saída (bipagem de lote)</strong>
          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            Código do lote (obrigatório)
            <input
              type="text"
              placeholder="Bipar ou digitar código do lote"
              value={saidaLote}
              onChange={(e) => setSaidaLote(e.target.value)}
              style={{
                padding: "9px 12px",
                borderRadius: 8,
                border: "1px solid rgba(128, 128, 128, 0.35)",
                background: "transparent",
                color: "inherit",
              }}
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
              Quantidade
              <input
                type="text"
                inputMode="decimal"
                placeholder="Ex.: 100"
                value={saidaQtd}
                onChange={(e) => setSaidaQtd(e.target.value)}
                style={{
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(128, 128, 128, 0.35)",
                  background: "transparent",
                  color: "inherit",
                }}
              />
            </label>

            <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
              Usuário (obrigatório)
              <input
                type="text"
                placeholder="Operador da expedição"
                value={saidaUsuario}
                onChange={(e) => setSaidaUsuario(e.target.value)}
                style={{
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(128, 128, 128, 0.35)",
                  background: "transparent",
                  color: "inherit",
                }}
              />
            </label>
          </div>

          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            Destino / Cliente (obrigatório)
            <input
              type="text"
              placeholder="Ex.: Hospital / Distribuidor"
              value={saidaDestino}
              onChange={(e) => setSaidaDestino(e.target.value)}
              style={{
                padding: "9px 12px",
                borderRadius: 8,
                border: "1px solid rgba(128, 128, 128, 0.35)",
                background: "transparent",
                color: "inherit",
              }}
            />
          </label>

          <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>
            A API bloqueia (422) lotes vencidos, não aprovados pela qualidade ou
            com registro ANVISA vencido.
          </p>

          <button
            type="submit"
            disabled={salvandoSaida}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              fontWeight: 600,
              cursor: "pointer",
              marginTop: "auto",
            }}
          >
            {salvandoSaida ? "Registrando saída..." : "Registrar expedição"}
          </button>
        </form>
      </div>

      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18 }}>Saldos por lote</h2>
          <input
            type="search"
            placeholder="Filtrar por lote ou produto..."
            value={buscaLote}
            onChange={(e) => setBuscaLote(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid rgba(128, 128, 128, 0.35)",
              background: "transparent",
              color: "inherit",
              minWidth: 240,
            }}
          />
        </div>

        {loading ? (
          <p>Carregando saldos...</p>
        ) : saldosFiltrados.length === 0 ? (
          <p style={{ opacity: 0.75 }}>Nenhum saldo de lote encontrado.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
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
                  <th style={{ padding: "10px 8px" }}>Lote</th>
                  <th style={{ padding: "10px 8px" }}>Produto</th>
                  <th style={{ padding: "10px 8px" }}>Saldo</th>
                  <th style={{ padding: "10px 8px" }}>Validade</th>
                  <th style={{ padding: "10px 8px" }}>Qualidade</th>
                  <th style={{ padding: "10px 8px" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {saldosFiltrados.map((item, idx) => {
                  const vencido = isLoteVencido(item.validade);
                  const abaixoMinimo =
                    typeof item.estoqueMinimo === "number" &&
                    item.quantidade <= item.estoqueMinimo;

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
                        {abaixoMinimo && (
                          <strong style={{ color: "#f59e0b" }}>
                            {" "}
                            • Mínimo
                          </strong>
                        )}
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        {formatarData(item.validade)}
                        {vencido && (
                          <strong style={{ color: "#ef4444" }}>
                            {" "}
                            • Vencido
                          </strong>
                        )}
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        {item.statusQualidade ?? "—"}
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        <button
                          type="button"
                          onClick={() => {
                            setCodigoRastreio(item.codigoLote);
                            consultarRastreabilidadeLote(item.codigoLote)
                              .then(setRastreio)
                              .catch(() => setRastreio(null));
                          }}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 6,
                            border: "1px solid currentColor",
                            background: "transparent",
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          Rastrear
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div
        style={{
          padding: 16,
          borderRadius: 12,
          border: "1px solid rgba(128, 128, 128, 0.25)",
          marginBottom: 28,
        }}
      >
        <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>
          Rastreabilidade do lote (RN07)
        </h2>

        <form
          onSubmit={handleRastrear}
          style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}
        >
          <input
            type="text"
            placeholder="Código do lote para rastrear"
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

      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18 }}>Movimentações</h2>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Filtrar produto"
              value={filtroProdutoMov}
              onChange={(e) => setFiltroProdutoMov(e.target.value)}
              style={{
                padding: "7px 10px",
                borderRadius: 8,
                border: "1px solid rgba(128, 128, 128, 0.35)",
                background: "transparent",
                color: "inherit",
              }}
            />
            <input
              type="date"
              value={filtroPeriodoInicio}
              onChange={(e) => setFiltroPeriodoInicio(e.target.value)}
              style={{
                padding: "7px 10px",
                borderRadius: 8,
                border: "1px solid rgba(128, 128, 128, 0.35)",
                background: "transparent",
                color: "inherit",
              }}
            />
            <input
              type="date"
              value={filtroPeriodoFim}
              onChange={(e) => setFiltroPeriodoFim(e.target.value)}
              style={{
                padding: "7px 10px",
                borderRadius: 8,
                border: "1px solid rgba(128, 128, 128, 0.35)",
                background: "transparent",
                color: "inherit",
              }}
            />
          </div>
        </div>

        {movimentacoes.length === 0 ? (
          <p style={{ opacity: 0.75 }}>Nenhuma movimentação registrada.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
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
                  <th style={{ padding: "10px 8px" }}>Data/Hora</th>
                  <th style={{ padding: "10px 8px" }}>Tipo</th>
                  <th style={{ padding: "10px 8px" }}>Lote</th>
                  <th style={{ padding: "10px 8px" }}>Quantidade</th>
                  <th style={{ padding: "10px 8px" }}>Usuário</th>
                  <th style={{ padding: "10px 8px" }}>Origem / Destino</th>
                </tr>
              </thead>
              <tbody>
                {movimentacoes.map((mov) => (
                  <tr
                    key={mov.id}
                    style={{
                      borderBottom: "1px solid rgba(128, 128, 128, 0.15)",
                    }}
                  >
                    <td style={{ padding: "10px 8px" }}>
                      {formatarDataHora(mov.dataHora)}
                    </td>
                    <td style={{ padding: "10px 8px", fontWeight: 600 }}>
                      {mov.tipo}
                    </td>
                    <td style={{ padding: "10px 8px" }}>{mov.codigoLote}</td>
                    <td style={{ padding: "10px 8px" }}>{mov.quantidade}</td>
                    <td style={{ padding: "10px 8px" }}>{mov.usuario}</td>
                    <td style={{ padding: "10px 8px" }}>
                      {mov.origemDestino ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}