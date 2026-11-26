"use client";

import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { listarProdutos, type Produto } from "../../lib/insumos";
import {
  atualizarOrdemProducao,
  confirmarMateriaisOrdem,
  emitirOrdemProducao,
  excluirOrdemProducao,
  listarOrdensProducao,
  type ItemNecessidade,
  type OrdemProducao,
  type StatusOrdem,
} from "../../lib/ordens";

const STATUS_OPCOES: Array<"TODAS" | StatusOrdem> = [
  "TODAS",
  "EMITIDA",
  "AGUARDANDO_MATERIAIS",
  "LIBERADA",
  "EM_PRODUCAO",
  "CONCLUIDA",
  "CANCELADA",
];

function formatarData(valor?: string): string {
  if (!valor) return "—";
  const d = new Date(`${valor.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return valor;
  return d.toLocaleDateString("pt-BR");
}

function OrdemProducaoConteudo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") === "nova" ? "nova" : "lista";

  const [ordens, setOrdens] = useState<OrdemProducao[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<"TODAS" | StatusOrdem>(
    "TODAS"
  );
  const [loading, setLoading] = useState(true);

  const [produtoId, setProdutoId] = useState<string>("");
  const [quantidade, setQuantidade] = useState("");
  const [prazo, setPrazo] = useState("");
  const [prioridade, setPrioridade] = useState("1");
  const [emitindo, setEmitindo] = useState(false);
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);
  const [faltasOrdem, setFaltasOrdem] = useState<{
    ordemId: number;
    numero?: string;
    itens: ItemNecessidade[];
  } | null>(null);

  function alternarView(novaView: "lista" | "nova") {
    setErroAcao(null);
    router.replace(`/ordem-producao?view=${novaView}`, { scroll: false });
  }

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [listaOrdens, listaProdutos] = await Promise.all([
        listarOrdensProducao(filtroStatus).catch(() => []),
        listarProdutos().catch(() => []),
      ]);
      setOrdens(listaOrdens);
      setProdutos(listaProdutos);
      if (listaProdutos.length > 0 && !produtoId) {
        setProdutoId(String(listaProdutos[0].id));
      }
    } finally {
      setLoading(false);
    }
  }, [filtroStatus, produtoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function handleEmitir(e: FormEvent) {
    e.preventDefault();
    setErroAcao(null);

    const idProd = Number(produtoId);
    const qtdNum = Number(quantidade.replace(",", "."));
    const prioNum = Number(prioridade);

    if (!idProd || Number.isNaN(idProd)) {
      setErroAcao("Selecione um produto.");
      return;
    }
    if (Number.isNaN(qtdNum) || qtdNum <= 0) {
      setErroAcao("Informe uma quantidade maior que zero.");
      return;
    }
    if (!prazo) {
      setErroAcao("Informe o prazo de entrega.");
      return;
    }

    setEmitindo(true);
    try {
      const criada = await emitirOrdemProducao({
        produtoId: idProd,
        quantidade: qtdNum,
        prazo,
        prioridade: Number.isNaN(prioNum) ? 1 : prioNum,
      });
      setOrdens((prev) => [criada, ...prev]);
      setQuantidade("");
      if (criada.faltas && criada.faltas.length > 0) {
        setFaltasOrdem({
          ordemId: criada.id,
          numero: criada.numero,
          itens: criada.faltas,
        });
      }
      alternarView("lista");
    } catch (err) {
      setErroAcao(
        err instanceof Error ? err.message : "Erro ao emitir ordem de produção."
      );
    } finally {
      setEmitindo(false);
    }
  }

  async function handleConfirmarMateriais(id: number) {
    setErroAcao(null);
    setConfirmandoId(id);
    try {
      const atualizada = await confirmarMateriaisOrdem(id);
      setOrdens((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...atualizada } : item))
      );
      if (atualizada.faltas && atualizada.faltas.length > 0) {
        setFaltasOrdem({
          ordemId: atualizada.id,
          numero: atualizada.numero,
          itens: atualizada.faltas,
        });
      } else if (faltasOrdem?.ordemId === id) {
        setFaltasOrdem(null);
      }
    } catch (err) {
      setErroAcao(
        err instanceof Error ? err.message : "Erro ao confirmar materiais."
      );
    } finally {
      setConfirmandoId(null);
    }
  }

  async function handleEditarOrdem(ordem: OrdemProducao) {
    setErroAcao(null);
    const novaQtdStr = window.prompt(
      "Nova quantidade:",
      String(ordem.quantidade ?? 1)
    );
    if (novaQtdStr === null) return;
    const novaQtd = Number(novaQtdStr.replace(",", "."));
    if (Number.isNaN(novaQtd) || novaQtd <= 0) {
      setErroAcao("Informe uma quantidade válida maior que zero.");
      return;
    }

    try {
      const atualizada = await atualizarOrdemProducao(ordem.id, {
        produtoId: ordem.produtoId ?? Number(produtoId),
        quantidade: novaQtd,
        prazo: ordem.prazo ? ordem.prazo.slice(0, 10) : prazo,
        prioridade: ordem.prioridade ?? 1,
      });
      setOrdens((prev) =>
        prev.map((item) =>
          item.id === ordem.id ? { ...item, ...atualizada } : item
        )
      );
    } catch (err) {
      setErroAcao(
        err instanceof Error ? err.message : "Erro ao atualizar ordem."
      );
    }
  }

  async function handleExcluirOrdem(id: number) {
    setErroAcao(null);
    if (!window.confirm(`Excluir a ordem #${id}?`)) return;

    try {
      await excluirOrdemProducao(id);
      setOrdens((prev) => prev.filter((item) => item.id !== id));
      if (faltasOrdem?.ordemId === id) {
        setFaltasOrdem(null);
      }
    } catch (err) {
      setErroAcao(
        err instanceof Error ? err.message : "Erro ao excluir ordem."
      );
    }
  }

  return (
    <section style={{ padding: 24, maxWidth: 1140, margin: "0 auto" }}>
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
            {view === "nova" ? "Nova ordem de produção" : "Ordens de produção"}
          </h1>
          <p style={{ margin: "4px 0 0", opacity: 0.75, fontSize: 14 }}>
            Emissão com verificação de materiais via BOM, faltas para Compras e
            liberação (RF06, RF25, RN04, RN13)
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => alternarView("lista")}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid currentColor",
              background: "transparent",
              fontWeight: view === "lista" ? 700 : 400,
              cursor: "pointer",
            }}
          >
            Ordens de produção
          </button>
          <button
            type="button"
            onClick={() => alternarView("nova")}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid currentColor",
              background: "transparent",
              fontWeight: view === "nova" ? 700 : 400,
              cursor: "pointer",
            }}
          >
            Nova ordem
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

      {erroAcao && (
        <p
          style={{
            margin: "0 0 16px",
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #ef4444",
            color: "#ef4444",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {erroAcao}
        </p>
      )}

      {view === "nova" && (
        <form
          onSubmit={handleEmitir}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 12,
            padding: 16,
            borderRadius: 12,
            border: "1px solid rgba(128, 128, 128, 0.25)",
            marginBottom: 24,
          }}
        >
          <strong style={{ gridColumn: "1 / -1" }}>
            Emitir ordem de produção (verificação automática de BOM)
          </strong>

          <label
            style={{
              display: "grid",
              gap: 4,
              fontSize: 13,
              gridColumn: "span 2",
            }}
          >
            Produto
            <select
              value={produtoId}
              onChange={(e) => setProdutoId(e.target.value)}
              style={{
                padding: "9px 12px",
                borderRadius: 8,
                border: "1px solid rgba(128, 128, 128, 0.35)",
                background: "transparent",
                color: "inherit",
              }}
            >
              {produtos.length === 0 ? (
                <option value="">Cadastre um produto em Insumos primeiro</option>
              ) : (
                produtos.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.codigo} — {p.descricao} ({p.unidade})
                  </option>
                ))
              )}
            </select>
          </label>

          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            Quantidade
            <input
              type="text"
              inputMode="decimal"
              placeholder="Ex.: 1000"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
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
            Prazo de entrega
            <input
              type="date"
              value={prazo}
              onChange={(e) => setPrazo(e.target.value)}
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
            Prioridade (1 = alta)
            <input
              type="number"
              min={1}
              max={10}
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value)}
              style={{
                padding: "9px 12px",
                borderRadius: 8,
                border: "1px solid rgba(128, 128, 128, 0.35)",
                background: "transparent",
                color: "inherit",
              }}
            />
          </label>

          <div
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={() => alternarView("lista")}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid currentColor",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={emitindo}
              style={{
                padding: "10px 18px",
                borderRadius: 8,
                border: "none",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {emitindo ? "Emitindo e verificando..." : "Emitir ordem"}
            </button>
          </div>
        </form>
      )}

      {faltasOrdem && faltasOrdem.itens.length > 0 && (
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            border: "1px solid rgba(245, 158, 11, 0.5)",
            marginBottom: 20,
            fontSize: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              marginBottom: 8,
            }}
          >
            <strong>
              Materiais em falta — {faltasOrdem.numero ?? `#${faltasOrdem.ordemId}`} (AGUARDANDO_MATERIAIS)
            </strong>
            <button
              type="button"
              onClick={() => setFaltasOrdem(null)}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                border: "1px solid currentColor",
                background: "transparent",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Fechar
            </button>
          </div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {faltasOrdem.itens.map((item) => (
              <li key={item.materialId}>
                <strong>{item.codigoMaterial}</strong> — {item.descricaoMaterial}:
                necessário {item.necessario}, disponível {item.disponivel},{" "}
                <strong>falta {item.falta}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {STATUS_OPCOES.map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setFiltroStatus(st)}
            style={{
              padding: "7px 12px",
              borderRadius: 8,
              border: "1px solid currentColor",
              background: "transparent",
              fontWeight: filtroStatus === st ? 700 : 400,
              cursor: "pointer",
            }}
          >
            {st}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Carregando ordens...</p>
      ) : ordens.length === 0 ? (
        <p style={{ opacity: 0.75 }}>Nenhuma ordem de produção encontrada.</p>
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
                <th style={{ padding: "10px 8px" }}>ID / Número</th>
                <th style={{ padding: "10px 8px" }}>Produto</th>
                <th style={{ padding: "10px 8px" }}>Quantidade</th>
                <th style={{ padding: "10px 8px" }}>Prazo</th>
                <th style={{ padding: "10px 8px" }}>Prioridade</th>
                <th style={{ padding: "10px 8px" }}>Status</th>
                <th style={{ padding: "10px 8px" }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {ordens.map((ordem) => (
                <tr
                  key={ordem.id}
                  style={{
                    borderBottom: "1px solid rgba(128, 128, 128, 0.15)",
                  }}
                >
                  <td style={{ padding: "10px 8px", fontWeight: 600 }}>
                    {ordem.numero ?? `#${ordem.id}`}
                  </td>
                  <td style={{ padding: "10px 8px" }}>
                    {ordem.codigoProduto
                      ? `${ordem.codigoProduto} — ${ordem.descricaoProduto ?? ""}`
                      : ordem.descricaoProduto ??
                        (ordem.produtoId ? `Produto #${ordem.produtoId}` : "—")}
                  </td>
                  <td style={{ padding: "10px 8px" }}>{ordem.quantidade}</td>
                  <td style={{ padding: "10px 8px" }}>
                    {formatarData(ordem.prazo)}
                  </td>
                  <td style={{ padding: "10px 8px" }}>{ordem.prioridade}</td>
                  <td style={{ padding: "10px 8px", fontWeight: 600 }}>
                    {ordem.status}
                  </td>
                  <td style={{ padding: "10px 8px" }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {(ordem.status === "EMITIDA" ||
                        ordem.status === "AGUARDANDO_MATERIAIS") && (
                        <button
                          type="button"
                          disabled={confirmandoId === ordem.id}
                          onClick={() => handleConfirmarMateriais(ordem.id)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 6,
                            border: "1px solid currentColor",
                            background: "transparent",
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          {confirmandoId === ordem.id
                            ? "Confirmando..."
                            : "Confirmar materiais e liberar"}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleEditarOrdem(ordem)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 6,
                          border: "1px solid currentColor",
                          background: "transparent",
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExcluirOrdem(ordem.id)}
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
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function OrdemProducaoPage() {
  return (
    <Suspense fallback={<p style={{ padding: 24 }}>Carregando...</p>}>
      <OrdemProducaoConteudo />
    </Suspense>
  );
}