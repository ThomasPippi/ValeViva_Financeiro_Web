"use client";

import { useEffect, useState } from "react";
import styles from "@/app/styles/paginas.module.css";
import { mensagemDeErro } from "@/app/lib/api";
import {
  atualizarFornecedor,
  buscarFornecedores,
  cadastrarFornecedor,
  excluirFornecedor,
  type Fornecedor,
} from "@/app/lib/fornecedores";

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");

  // campos do formulário (o mesmo form serve para criar e editar)
  const [mostrarForm, setMostrarForm] = useState(false);
  // null = cadastrando um novo; preenchido = editando esse fornecedor
  const [editando, setEditando] = useState<Fornecedor | null>(null);
  const [razaoSocial, setRazaoSocial] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [prazoEntrega, setPrazoEntrega] = useState("7");
  const [ativo, setAtivo] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState("");
  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  function carregarFornecedores() {
    buscarFornecedores()
      .then((lista) => {
        setFornecedores(lista);
        setErro("");
      })
      .catch(() => setErro("Não foi possível carregar os fornecedores."))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregarFornecedores();
  }, []);

  function limparFormulario() {
    setRazaoSocial("");
    setNomeFantasia("");
    setCnpj("");
    setEmail("");
    setTelefone("");
    setPrazoEntrega("7");
    setAtivo(true);
    setErroForm("");
    setEditando(null);
  }

  function fecharFormulario() {
    limparFormulario();
    setMostrarForm(false);
  }

  function abrirEdicao(f: Fornecedor) {
    setEditando(f);
    setRazaoSocial(f.razao_social ?? "");
    setNomeFantasia(f.nome_fantasia ?? "");
    setCnpj(f.cnpj ?? "");
    setEmail(f.email ?? "");
    setTelefone(f.telefone ?? "");
    setPrazoEntrega(String(f.prazo_entrega_dias ?? 0));
    setAtivo(f.is_ativo);
    setErroForm("");
    setMostrarForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluir(f: Fornecedor) {
    const confirmou = window.confirm(
      `Excluir o fornecedor "${f.nome_fantasia || f.razao_social}"?\n\n` +
        "Todos os pedidos de compra desse fornecedor também serão excluídos. Essa ação não pode ser desfeita.",
    );
    if (!confirmou) return;

    setExcluindoId(f.id);
    setErro("");
    try {
      await excluirFornecedor(f.id);
      if (editando?.id === f.id) fecharFormulario();
      carregarFornecedores();
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível excluir o fornecedor."));
    }
    setExcluindoId(null);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();

    if (razaoSocial.trim() === "" || cnpj.trim() === "") {
      setErroForm("Razão social e CNPJ são obrigatórios.");
      return;
    }

    setSalvando(true);
    setErroForm("");

    const dados = {
      razao_social: razaoSocial,
      nome_fantasia: nomeFantasia,
      cnpj: cnpj,
      email: email,
      telefone: telefone,
      prazo_entrega_dias: Number(prazoEntrega) || 0,
      is_ativo: ativo,
    };

    try {
      if (editando) {
        await atualizarFornecedor(editando.id, dados);
      } else {
        await cadastrarFornecedor(dados);
      }
      fecharFormulario();
      carregarFornecedores();
    } catch (e) {
      setErroForm(mensagemDeErro(e, "Não foi possível salvar o fornecedor."));
    }

    setSalvando(false);
  }

  const fornecedoresFiltrados = fornecedores.filter((f) => {
    const texto = busca.toLowerCase();
    return (
      (f.razao_social ?? "").toLowerCase().includes(texto) ||
      (f.nome_fantasia ?? "").toLowerCase().includes(texto) ||
      (f.cnpj ?? "").includes(texto)
    );
  });

  return (
    <section className={styles.pagina}>
      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>Fornecedores</h1>
          <p className={styles.subtitulo}>Cadastro e consulta de fornecedores</p>
        </div>
        {!mostrarForm && (
          <button className={styles.botao} onClick={() => setMostrarForm(true)}>
            + Novo fornecedor
          </button>
        )}
      </div>

      {mostrarForm && (
        <form className={styles.card} onSubmit={salvar}>
          <h2 className={styles.modalTitulo}>
            {editando ? `Editar fornecedor #${editando.id}` : "Novo fornecedor"}
          </h2>

          {erroForm && <p className={styles.erro} style={{ marginBottom: 12 }}>{erroForm}</p>}

          <div className={styles.formulario}>
            <label className={styles.campo}>
              Razão social *
              <input className={styles.input} value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} />
            </label>

            <label className={styles.campo}>
              Nome fantasia
              <input className={styles.input} value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} />
            </label>

            <label className={styles.campo}>
              CNPJ *
              <input
                className={styles.input}
                placeholder="00.000.000/0000-00"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
              />
            </label>

            <label className={styles.campo}>
              E-mail
              <input className={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>

            <label className={styles.campo}>
              Telefone
              <input className={styles.input} value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            </label>

            <label className={styles.campo}>
              Prazo de entrega (dias)
              <input
                className={styles.input}
                type="number"
                min="0"
                value={prazoEntrega}
                onChange={(e) => setPrazoEntrega(e.target.value)}
              />
            </label>

            {editando && (
              <label className={styles.checkbox}>
                <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
                Fornecedor ativo
              </label>
            )}
          </div>

          <div className={styles.rodapeForm}>
            <button
              type="button"
              className={styles.botaoSecundario}
              onClick={fecharFormulario}
            >
              Cancelar
            </button>
            <button type="submit" className={styles.botao} disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      )}

      <div className={styles.filtros}>
        <input
          className={`${styles.input} ${styles.campoBusca}`}
          type="search"
          placeholder="Buscar por razão social, nome fantasia ou CNPJ..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {erro && <p className={styles.erro}>{erro}</p>}

      <div className={styles.tabelaContainer}>
        <table className={styles.tabela}>
          <thead>
            <tr>
              <th>Razão social</th>
              <th>Nome fantasia</th>
              <th>CNPJ</th>
              <th>E-mail</th>
              <th>Telefone</th>
              <th>Prazo</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {fornecedoresFiltrados.map((f) => (
              <tr key={f.id}>
                <td>{f.razao_social}</td>
                <td>{f.nome_fantasia || "—"}</td>
                <td>{f.cnpj}</td>
                <td>{f.email || "—"}</td>
                <td>{f.telefone || "—"}</td>
                <td>{f.prazo_entrega_dias} dias</td>
                <td>
                  {f.is_ativo ? (
                    <span className={`${styles.tag} ${styles.tagVerde}`}>Ativo</span>
                  ) : (
                    <span className={styles.tag}>Inativo</span>
                  )}
                </td>
                <td>
                  <div className={styles.acoesLinha}>
                    <button type="button" className={styles.botaoPequeno} onClick={() => abrirEdicao(f)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className={`${styles.botaoPequeno} ${styles.botaoPerigo}`}
                      onClick={() => excluir(f)}
                      disabled={excluindoId === f.id}
                    >
                      {excluindoId === f.id ? "Excluindo..." : "Excluir"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {carregando && <p className={styles.vazio}>Carregando...</p>}
        {!carregando && fornecedoresFiltrados.length === 0 && (
          <p className={styles.vazio}>Nenhum fornecedor encontrado.</p>
        )}
      </div>
    </section>
  );
}
