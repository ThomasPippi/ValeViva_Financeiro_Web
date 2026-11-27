"use client";

import { useState } from "react";
import styles from "@/app/styles/paginas.module.css";
import { mensagemDeErro } from "@/app/lib/api";
import {
  atualizarProduto,
  cadastrarProduto,
  type Produto,
  type TipoProduto,
} from "@/app/lib/produtos";

type Props = {
  /** Produto a editar; sem ele, o modal cadastra um novo. */
  produto?: Produto;
  onFechar: () => void;
  onSalvo: () => void;
};

export default function ProdutoModal({ produto, onFechar, onSalvo }: Props) {
  // Na edição, os campos começam com os dados do produto.
  const [nome, setNome] = useState(produto?.nome ?? "");
  const [codigo, setCodigo] = useState(produto?.codigo ?? "");
  const [descricao, setDescricao] = useState(produto?.descricao ?? "");
  const [tipo, setTipo] = useState<TipoProduto>(produto?.tipo ?? "MATERIA_PRIMA");
  const [unidade, setUnidade] = useState(produto?.unidade ?? "UN");
  const [preco, setPreco] = useState(produto ? String(produto.preco ?? "").replace(".", ",") : "");
  const [estoque, setEstoque] = useState(String(produto?.quantidade_estoque ?? 0));
  const [estoqueMinimo, setEstoqueMinimo] = useState(String(produto?.estoque_minimo ?? 0));
  const [registroAnvisa, setRegistroAnvisa] = useState(produto?.registro_anvisa ?? "");
  const [vencimentoAnvisa, setVencimentoAnvisa] = useState(produto?.vencimento_anvisa ?? "");
  const [ativo, setAtivo] = useState(produto?.is_ativo ?? true);

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar(e: React.FormEvent) {
    e.preventDefault();

    if (nome.trim() === "" || codigo.trim() === "") {
      setErro("Preencha pelo menos nome e código.");
      return;
    }

    setSalvando(true);
    setErro("");

    try {
      const dados = {
        nome: nome,
        codigo: codigo,
        descricao: descricao,
        tipo: tipo,
        unidade: unidade,
        preco: Number(preco.replace(",", ".")) || 0,
        quantidade_estoque: Number(estoque) || 0,
        estoque_minimo: Number(estoqueMinimo) || 0,
        registro_anvisa: registroAnvisa || null,
        vencimento_anvisa: vencimentoAnvisa || null,
        is_ativo: ativo,
      };
      if (produto) {
        await atualizarProduto(produto.id, dados);
      } else {
        await cadastrarProduto(dados);
      }
      onSalvo();
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível salvar o produto."));
    }

    setSalvando(false);
  }

  return (
    <div className={styles.fundoModal} onClick={onFechar}>
      {/* stopPropagation pra não fechar quando clica dentro do modal */}
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitulo}>
          {produto ? `Editar produto ${produto.codigo}` : "Novo produto"}
        </h2>

        {erro && <p className={styles.erro} style={{ marginBottom: 12 }}>{erro}</p>}

        <form onSubmit={salvar}>
          <div className={styles.formulario}>
            <label className={styles.campo}>
              Nome *
              <input className={styles.input} value={nome} onChange={(e) => setNome(e.target.value)} />
            </label>

            <label className={styles.campo}>
              Código *
              <input className={styles.input} value={codigo} onChange={(e) => setCodigo(e.target.value)} />
            </label>

            <label className={`${styles.campo} ${styles.campoInteiro}`}>
              Descrição
              <input className={styles.input} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            </label>

            <label className={styles.campo}>
              Tipo
              <select
                className={styles.select}
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoProduto)}
              >
                <option value="MATERIA_PRIMA">Matéria-prima</option>
                <option value="COMPONENTE">Componente</option>
                <option value="PRODUTO_FINAL">Produto final</option>
              </select>
            </label>

            <label className={styles.campo}>
              Unidade
              <select className={styles.select} value={unidade} onChange={(e) => setUnidade(e.target.value)}>
                <option value="UN">UN</option>
                <option value="KG">KG</option>
                <option value="TON">TON</option>
              </select>
            </label>

            <label className={styles.campo}>
              Preço (R$)
              <input
                className={styles.input}
                placeholder="0,00"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
              />
            </label>

            <label className={styles.campo}>
              Quantidade em estoque
              <input
                className={styles.input}
                type="number"
                min="0"
                value={estoque}
                onChange={(e) => setEstoque(e.target.value)}
              />
            </label>

            <label className={styles.campo}>
              Estoque mínimo
              <input
                className={styles.input}
                type="number"
                min="0"
                value={estoqueMinimo}
                onChange={(e) => setEstoqueMinimo(e.target.value)}
              />
            </label>

            <label className={styles.campo}>
              Registro ANVISA
              <input
                className={styles.input}
                value={registroAnvisa}
                onChange={(e) => setRegistroAnvisa(e.target.value)}
              />
            </label>

            <label className={styles.campo}>
              Vencimento ANVISA
              <input
                className={styles.input}
                type="date"
                value={vencimentoAnvisa}
                onChange={(e) => setVencimentoAnvisa(e.target.value)}
              />
            </label>

            {produto && (
              <label className={styles.checkbox}>
                <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
                Produto ativo
              </label>
            )}
          </div>

          <div className={styles.rodapeForm}>
            <button type="button" className={styles.botaoSecundario} onClick={onFechar}>
              Cancelar
            </button>
            <button type="submit" className={styles.botao} disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
