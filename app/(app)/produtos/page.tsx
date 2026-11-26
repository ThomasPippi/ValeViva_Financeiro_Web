"use client";

import { useEffect, useState } from "react";
import styles from "@/app/styles/paginas.module.css";
import { formatCurrency } from "@/app/lib/format";
import { buscarProdutos, nomesTipo, type Produto } from "@/app/lib/produtos";
import NovoProdutoModal from "./NovoProdutoModal";

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState("TODOS");

  const [mostrarNovo, setMostrarNovo] = useState(false);

  function carregarProdutos() {
    buscarProdutos()
      .then((lista) => {
        setProdutos(lista);
        setErro("");
      })
      .catch(() => setErro("Não foi possível carregar os produtos."))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregarProdutos();
  }, []);

  // filtra pela busca (nome ou código) e pelo tipo
  const produtosFiltrados = produtos.filter((produto) => {
    const texto = busca.toLowerCase();
    const bateBusca =
      (produto.nome ?? "").toLowerCase().includes(texto) ||
      (produto.codigo ?? "").toLowerCase().includes(texto);
    const bateTipo = tipo === "TODOS" || produto.tipo === tipo;
    return bateBusca && bateTipo;
  });

  return (
    <section className={styles.pagina}>
      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>Produtos</h1>
          <p className={styles.subtitulo}>Matérias-primas, componentes e produtos finais</p>
        </div>
        <div className={styles.acoes}>
          <button className={styles.botao} onClick={() => setMostrarNovo(true)}>
            + Novo produto
          </button>
        </div>
      </div>

      <div className={styles.filtros}>
        <input
          className={`${styles.input} ${styles.campoBusca}`}
          type="search"
          placeholder="Buscar por nome ou código..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select
          className={styles.select}
          style={{ width: "auto" }}
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        >
          <option value="TODOS">Todos os tipos</option>
          <option value="MATERIA_PRIMA">Matéria-prima</option>
          <option value="COMPONENTE">Componente</option>
          <option value="PRODUTO_FINAL">Produto final</option>
        </select>
      </div>

      {erro && <p className={styles.erro}>{erro}</p>}

      <div className={styles.tabelaContainer}>
        <table className={styles.tabela}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Unidade</th>
              <th>Preço</th>
              <th>Estoque</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {produtosFiltrados.map((produto) => (
              <tr key={produto.id}>
                <td>{produto.codigo}</td>
                <td>{produto.nome}</td>
                <td>{nomesTipo[produto.tipo] ?? produto.tipo}</td>
                <td>{produto.unidade}</td>
                <td>{formatCurrency(produto.preco ?? 0)}</td>
                <td>
                  {produto.quantidade_estoque}
                  {produto.quantidade_estoque < produto.estoque_minimo && (
                    <span className={`${styles.tag} ${styles.tagAmarela}`} style={{ marginLeft: 6 }}>
                      Baixo
                    </span>
                  )}
                </td>
                <td>
                  {produto.is_ativo ? (
                    <span className={`${styles.tag} ${styles.tagVerde}`}>Ativo</span>
                  ) : (
                    <span className={styles.tag}>Inativo</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {carregando && <p className={styles.vazio}>Carregando...</p>}
        {!carregando && produtosFiltrados.length === 0 && (
          <p className={styles.vazio}>Nenhum produto encontrado.</p>
        )}
      </div>

      {mostrarNovo && (
        <NovoProdutoModal
          onFechar={() => setMostrarNovo(false)}
          onSalvo={() => {
            setMostrarNovo(false);
            carregarProdutos();
          }}
        />
      )}
    </section>
  );
}
