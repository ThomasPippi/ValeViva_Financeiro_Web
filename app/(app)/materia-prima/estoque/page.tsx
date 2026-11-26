"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  atualizarProduto,
  criarProduto,
  excluirProduto,
  listarProdutos,
  type Produto,
  type TipoProduto,
} from "../../../lib/insumos";

const TIPO_LABEL: Record<TipoProduto, string> = {
  MATERIA_PRIMA: "Matéria-prima",
  COMPONENTE: "Componente",
  PRODUTO_FINAL: "Produto final",
};

function isRegistroVigente(validadeRegistro: string | null): boolean | null {
  if (!validadeRegistro) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const validade = new Date(`${validadeRegistro.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(validade.getTime())) return null;
  return validade >= hoje;
}

function formatarMoeda(valor: number): string {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data: string | null): string {
  if (!data) return "—";
  const d = new Date(`${data.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return data;
  return d.toLocaleDateString("pt-BR");
}

export default function CadastroInsumosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<"TODOS" | TipoProduto>(
    "MATERIA_PRIMA"
  );
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [quantidadeEstoqueAtual, setQuantidadeEstoqueAtual] = useState(0);
  const [isAtivoAtual, setIsAtivoAtual] = useState(true);

  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [unidade, setUnidade] = useState("un");
  const [tipo, setTipo] = useState<TipoProduto>("MATERIA_PRIMA");
  const [precoVenda, setPrecoVenda] = useState("");
  const [estoqueMinimo, setEstoqueMinimo] = useState("");
  const [registroAnvisa, setRegistroAnvisa] = useState("");
  const [validadeRegistro, setValidadeRegistro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);
  const [erroForm, setErroForm] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const dados = await listarProdutos().catch(() => []);
      setProdutos(dados);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function limparFormulario() {
    setEditandoId(null);
    setQuantidadeEstoqueAtual(0);
    setIsAtivoAtual(true);
    setNome("");
    setCodigo("");
    setDescricao("");
    setUnidade("un");
    setTipo("MATERIA_PRIMA");
    setPrecoVenda("");
    setEstoqueMinimo("");
    setRegistroAnvisa("");
    setValidadeRegistro("");
    setErroForm(null);
  }

  function handleIniciarEdicao(item: Produto) {
    setErroForm(null);
    setEditandoId(item.id);
    setQuantidadeEstoqueAtual(item.quantidade_estoque ?? 0);
    setIsAtivoAtual(item.is_ativo ?? true);
    setNome(item.nome ?? "");
    setCodigo(item.codigo ?? "");
    setDescricao(item.descricao ?? "");
    setUnidade(item.unidade ?? "un");
    setTipo(item.tipo ?? "MATERIA_PRIMA");
    setPrecoVenda(String(item.preco ?? ""));
    setEstoqueMinimo(String(item.estoque_minimo ?? ""));
    setRegistroAnvisa(item.registro_anvisa ?? "");
    setValidadeRegistro(
      item.vencimento_anvisa ? item.vencimento_anvisa.slice(0, 10) : ""
    );
  }

  async function handleExcluir(item: Produto) {
    setErroForm(null);
    if (!window.confirm(`Excluir o item ${item.codigo} (${item.nome})?`)) return;

    setExcluindoId(item.id);
    try {
      await excluirProduto(item.id);
      if (editandoId === item.id) {
        limparFormulario();
      }
      await carregar();
    } catch (err) {
      setErroForm(
        err instanceof Error ? err.message : "Erro ao excluir insumo."
      );
    } finally {
      setExcluindoId(null);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErroForm(null);

    const precoNum = Number(precoVenda.replace(",", "."));
    const estoqueMinNum = Number(estoqueMinimo.replace(",", "."));

    if (!nome.trim() || !codigo.trim() || !descricao.trim() || !unidade.trim()) {
      setErroForm("Preencha nome, código, descrição e unidade.");
      return;
    }
    if (Number.isNaN(precoNum) || precoNum < 0) {
      setErroForm("Informe um preço/valor unitário válido.");
      return;
    }
    if (Number.isNaN(estoqueMinNum) || estoqueMinNum < 0) {
      setErroForm("Informe um estoque mínimo válido.");
      return;
    }

    const payload = {
      nome: nome.trim(),
      codigo: codigo.trim(),
      descricao: descricao.trim(),
      unidade: unidade.trim(),
      tipo,
      preco: precoNum,
      quantidade_estoque: editandoId !== null ? quantidadeEstoqueAtual : 0,
      estoque_minimo: estoqueMinNum,
      registro_anvisa: registroAnvisa.trim() || null,
      vencimento_anvisa: validadeRegistro || null,
      is_ativo: editandoId !== null ? isAtivoAtual : true,
    };

    setSalvando(true);
    try {
      if (editandoId !== null) {
        await atualizarProduto(editandoId, payload);
      } else {
        await criarProduto(payload);
      }
      limparFormulario();
      await carregar();
    } catch (err) {
      setErroForm(
        err instanceof Error ? err.message : "Erro ao salvar insumo."
      );
    } finally {
      setSalvando(false);
    }
  }

  const termo = busca.trim().toLowerCase();
  const itensFiltrados = produtos.filter((item) => {
    const bateTipo = filtroTipo === "TODOS" || item.tipo === filtroTipo;
    const bateBusca =
      !termo ||
      (item.nome ?? "").toLowerCase().includes(termo) ||
      (item.codigo ?? "").toLowerCase().includes(termo) ||
      (item.descricao ?? "").toLowerCase().includes(termo) ||
      (item.registro_anvisa ?? "").toLowerCase().includes(termo);
    return bateTipo && bateBusca;
  });

  return (
    <section style={{ padding: 24, maxWidth: 1120, margin: "0 auto" }}>
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
          <h1 style={{ margin: 0, fontSize: 24 }}>Cadastro de insumos</h1>
          <p style={{ margin: "4px 0 0", opacity: 0.75, fontSize: 14 }}>
            Matérias-primas, componentes e produtos acabados (RF22 / RN16)
          </p>
        </div>

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
          {loading ? "Atualizando..." : "Atualizar lista"}
        </button>
      </header>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
          padding: 16,
          borderRadius: 12,
          border: "1px solid rgba(128, 128, 128, 0.25)",
          marginBottom: 24,
        }}
      >
        <strong style={{ gridColumn: "1 / -1" }}>
          {editandoId !== null
            ? `Editando item #${editandoId}`
            : "Novo item / insumo"}
        </strong>

        <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
          Nome
          <input
            type="text"
            placeholder="Ex.: Resina de polipropileno"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
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
          Código
          <input
            type="text"
            placeholder="Ex.: MP-001"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            style={{
              padding: "9px 12px",
              borderRadius: 8,
              border: "1px solid rgba(128, 128, 128, 0.35)",
              background: "transparent",
              color: "inherit",
            }}
          />
        </label>

        <label
          style={{
            display: "grid",
            gap: 4,
            fontSize: 13,
            gridColumn: "span 2",
          }}
        >
          Descrição
          <input
            type="text"
            placeholder="Ex.: Resina médica / Agulha / Cateter"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
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
          Tipo
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoProduto)}
            style={{
              padding: "9px 12px",
              borderRadius: 8,
              border: "1px solid rgba(128, 128, 128, 0.35)",
              background: "transparent",
              color: "inherit",
            }}
          >
            <option value="MATERIA_PRIMA">Matéria-prima</option>
            <option value="COMPONENTE">Componente</option>
            <option value="PRODUTO_FINAL">Produto final</option>
          </select>
        </label>

        <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
          Unidade
          <input
            type="text"
            placeholder="kg, un, cx, ml..."
            value={unidade}
            onChange={(e) => setUnidade(e.target.value)}
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
          Preço / Valor unitário (R$)
          <input
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={precoVenda}
            onChange={(e) => setPrecoVenda(e.target.value)}
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
          Estoque mínimo
          <input
            type="text"
            inputMode="decimal"
            placeholder="Ex.: 100"
            value={estoqueMinimo}
            onChange={(e) => setEstoqueMinimo(e.target.value)}
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
          Registro ANVISA (opcional)
          <input
            type="text"
            placeholder="Nº do registro"
            value={registroAnvisa}
            onChange={(e) => setRegistroAnvisa(e.target.value)}
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
          Validade do registro ANVISA
          <input
            type="date"
            value={validadeRegistro}
            onChange={(e) => setValidadeRegistro(e.target.value)}
            style={{
              padding: "9px 12px",
              borderRadius: 8,
              border: "1px solid rgba(128, 128, 128, 0.35)",
              background: "transparent",
              color: "inherit",
            }}
          />
        </label>

        {erroForm && (
          <p
            style={{
              gridColumn: "1 / -1",
              margin: 0,
              fontSize: 13,
              color: "#ef4444",
              fontWeight: 600,
            }}
          >
            {erroForm}
          </p>
        )}

        <div
          style={{
            gridColumn: "1 / -1",
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          {editandoId !== null && (
            <button
              type="button"
              onClick={limparFormulario}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid currentColor",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              Cancelar edição
            </button>
          )}
          <button
            type="submit"
            disabled={salvando}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              border: "none",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {salvando
              ? "Salvando..."
              : editandoId !== null
              ? "Salvar alterações"
              : "Cadastrar insumo"}
          </button>
        </div>
      </form>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(
            [
              ["MATERIA_PRIMA", "Matéria-prima"],
              ["COMPONENTE", "Componentes"],
              ["PRODUTO_FINAL", "Produtos finais"],
              ["TODOS", "Todos"],
            ] as const
          ).map(([chave, rotulo]) => (
            <button
              key={chave}
              type="button"
              onClick={() => setFiltroTipo(chave)}
              style={{
                padding: "7px 12px",
                borderRadius: 8,
                border: "1px solid currentColor",
                background: "transparent",
                fontWeight: filtroTipo === chave ? 700 : 400,
                cursor: "pointer",
              }}
            >
              {rotulo}
            </button>
          ))}
        </div>

        <input
          type="search"
          placeholder="Buscar por código, descrição ou ANVISA..."
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
      </div>

      {loading ? (
        <p>Carregando itens...</p>
      ) : itensFiltrados.length === 0 ? (
        <p style={{ opacity: 0.75 }}>Nenhum item encontrado.</p>
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
                <th style={{ padding: "10px 8px" }}>Código</th>
                <th style={{ padding: "10px 8px" }}>Nome</th>
                <th style={{ padding: "10px 8px" }}>Descrição</th>
                <th style={{ padding: "10px 8px" }}>Tipo</th>
                <th style={{ padding: "10px 8px" }}>Un.</th>
                <th style={{ padding: "10px 8px" }}>Preço</th>
                <th style={{ padding: "10px 8px" }}>Est. mín.</th>
                <th style={{ padding: "10px 8px" }}>ANVISA / Validade</th>
                <th style={{ padding: "10px 8px" }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {itensFiltrados.map((item) => {
                const vigente = isRegistroVigente(item.vencimento_anvisa);
                return (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: "1px solid rgba(128, 128, 128, 0.15)",
                    }}
                  >
                    <td style={{ padding: "10px 8px", fontWeight: 600 }}>
                      {item.codigo}
                    </td>
                    <td style={{ padding: "10px 8px" }}>{item.nome}</td>
                    <td style={{ padding: "10px 8px" }}>{item.descricao}</td>
                    <td style={{ padding: "10px 8px" }}>
                      {TIPO_LABEL[item.tipo] ?? item.tipo}
                    </td>
                    <td style={{ padding: "10px 8px" }}>{item.unidade}</td>
                    <td style={{ padding: "10px 8px" }}>
                      {formatarMoeda(item.preco)}
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      {item.estoque_minimo}
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      {item.registro_anvisa ? (
                        <span>
                          {item.registro_anvisa} (
                          {formatarData(item.vencimento_anvisa)})
                          {vigente === false && (
                            <strong style={{ color: "#ef4444" }}>
                              {" "}
                              - Vencido
                            </strong>
                          )}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => handleIniciarEdicao(item)}
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
                          disabled={excluindoId === item.id}
                          onClick={() => handleExcluir(item)}
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
                          {excluindoId === item.id ? "Excluindo..." : "Excluir"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}