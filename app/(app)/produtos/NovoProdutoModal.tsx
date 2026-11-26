"use client";

import { useState } from "react";
import styles from "@/app/styles/paginas.module.css";
import { cadastrarProduto, type TipoProduto } from "@/app/lib/produtos";

type Props = {
  onFechar: () => void;
  onSalvo: () => void;
};

export default function NovoProdutoModal({ onFechar, onSalvo }: Props) {
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<TipoProduto>("MATERIA_PRIMA");
  const [unidade, setUnidade] = useState("UN");
  const [preco, setPreco] = useState("");
  const [estoque, setEstoque] = useState("0");
  const [estoqueMinimo, setEstoqueMinimo] = useState("0");
  const [registroAnvisa, setRegistroAnvisa] = useState("");
  const [vencimentoAnvisa, setVencimentoAnvisa] = useState("");

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
      await cadastrarProduto({
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
        is_ativo: true,
      });
      onSalvo();
    } catch {
      setErro("Não foi possível salvar o produto.");
    }

    setSalvando(false);
  }

  return (
    <div className={styles.fundoModal} onClick={onFechar}>
      {/* stopPropagation pra não fechar quando clica dentro do modal */}
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitulo}>Novo produto</h2>

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
