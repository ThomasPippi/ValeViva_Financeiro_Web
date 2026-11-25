"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "@/app/styles/paginas.module.css";
import { formatCurrency } from "@/app/lib/format";
import { buscarFornecedores, type Fornecedor } from "@/app/lib/fornecedores";
import { buscarProdutos, type Produto } from "@/app/lib/produtos";
import { cadastrarPedido, hojeISO } from "@/app/lib/pedidosCompra";

type ItemForm = {
  produtoId: string;
  quantidade: string;
  preco: string;
};

const itemVazio: ItemForm = { produtoId: "", quantidade: "1", preco: "" };

export default function NovoPedidoPage() {
  const router = useRouter();

  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);

  const [fornecedorId, setFornecedorId] = useState("");
  const [dataPrometida, setDataPrometida] = useState("");
  const [itens, setItens] = useState<ItemForm[]>([itemVazio]);

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    buscarFornecedores()
      .then((lista) => setFornecedores(lista))
      .catch(() => setErro("Erro ao carregar fornecedores."));
    buscarProdutos()
      .then((lista) => setProdutos(lista))
      .catch(() => setErro("Erro ao carregar produtos."));
  }, []);

  function alterarItem(index: number, campo: keyof ItemForm, valor: string) {
    const novosItens = [...itens];
    novosItens[index] = { ...novosItens[index], [campo]: valor };

    // quando escolhe o produto, já preenche o preço cadastrado
    if (campo === "produtoId") {
      const produto = produtos.find((p) => p.id === Number(valor));
      if (produto) {
        novosItens[index].preco = String(produto.preco ?? "");
      }
    }

    setItens(novosItens);
  }

  function adicionarItem() {
    setItens([...itens, itemVazio]);
  }

  function removerItem(index: number) {
    setItens(itens.filter((_, i) => i !== index));
  }

  let total = 0;
  for (const item of itens) {
    total += (Number(item.quantidade) || 0) * (Number(item.preco.replace(",", ".")) || 0);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();

    if (fornecedorId === "" || dataPrometida === "") {
      setErro("Escolha o fornecedor e a data prometida de entrega.");
      return;
    }

    const itensValidos = itens.filter((item) => item.produtoId !== "" && Number(item.quantidade) > 0);
    if (itensValidos.length === 0) {
      setErro("Adicione pelo menos um produto.");
      return;
    }

    setSalvando(true);
    setErro("");

    try {
      await cadastrarPedido({
        fornecedor_id: Number(fornecedorId),
        data_pedido: hojeISO(),
        data_prometida: dataPrometida,
        itens: itensValidos.map((item) => ({
          produto_id: Number(item.produtoId),
          quantidade: Number(item.quantidade),
          preco_unitario: Number(item.preco.replace(",", ".")) || 0,
        })),
      });
      router.push("/pedidos-compra");
    } catch {
      setErro("Não foi possível salvar o pedido.");
      setSalvando(false);
    }
  }

  // quando escolhe o fornecedor, sugere a data usando o prazo de entrega dele
  function escolherFornecedor(id: string) {
    setFornecedorId(id);
    const fornecedor = fornecedores.find((f) => f.id === Number(id));
    if (fornecedor && dataPrometida === "") {
      const data = new Date();
      data.setDate(data.getDate() + fornecedor.prazo_entrega_dias);
      setDataPrometida(data.toISOString().slice(0, 10));
    }
  }

  return (
    <section className={styles.pagina}>
      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>Novo pedido de compra</h1>
          <p className={styles.subtitulo}>Escolha o fornecedor e os produtos</p>
        </div>
        <Link href="/pedidos-compra" className={styles.botaoSecundario}>
          Voltar
        </Link>
      </div>

      {erro && <p className={styles.erro}>{erro}</p>}

      <form className={styles.card} onSubmit={salvar}>
        <div className={styles.formulario}>
          <label className={styles.campo}>
            Fornecedor *
            <select className={styles.select} value={fornecedorId} onChange={(e) => escolherFornecedor(e.target.value)}>
              <option value="">Selecione...</option>
              {fornecedores.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome_fantasia || f.razao_social}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.campo}>
            Entrega prometida *
            <input
              className={styles.input}
              type="date"
              value={dataPrometida}
              onChange={(e) => setDataPrometida(e.target.value)}
            />
          </label>
        </div>

        <h3 style={{ margin: "20px 0 10px", fontSize: 15 }}>Itens</h3>

        {itens.map((item, index) => (
          <div key={index} className={styles.linhaItem}>
            <label className={styles.campo}>
              Produto
              <select
                className={styles.select}
                value={item.produtoId}
                onChange={(e) => alterarItem(index, "produtoId", e.target.value)}
              >
                <option value="">Selecione...</option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo} - {p.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.campo}>
              Quantidade
              <input
                className={styles.input}
                type="number"
                min="1"
                value={item.quantidade}
                onChange={(e) => alterarItem(index, "quantidade", e.target.value)}
              />
            </label>

            <label className={styles.campo}>
              Preço unitário
              <input
                className={styles.input}
                value={item.preco}
                onChange={(e) => alterarItem(index, "preco", e.target.value)}
              />
            </label>

            <button
              type="button"
              className={styles.botaoSecundario}
              onClick={() => removerItem(index)}
              disabled={itens.length === 1}
            >
              Remover
            </button>
          </div>
        ))}

        <button type="button" className={styles.botaoPequeno} onClick={adicionarItem}>
          + Adicionar item
        </button>

        <p className={styles.total}>Total: {formatCurrency(total)}</p>

        <div className={styles.rodapeForm}>
          <button type="submit" className={styles.botao} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar pedido"}
          </button>
        </div>
      </form>
    </section>
  );
}
