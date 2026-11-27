"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import styles from "@/app/styles/paginas.module.css";
import { formatDate } from "@/app/lib/format";
import { buscarPedido, hojeISO, registrarRecebimento, type PedidoCompra } from "@/app/lib/pedidosCompra";

function RecebimentoConteudo() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [pedido, setPedido] = useState<PedidoCompra | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [dataRecebimento, setDataRecebimento] = useState(hojeISO());
  // quantidade recebida de cada item, a chave é o id do item
  const [recebidos, setRecebidos] = useState<Record<number, string>>({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    buscarPedido(id)
      .then((dados) => {
        setPedido(dados);
        // já preenche com a quantidade pedida
        const valoresIniciais: Record<number, string> = {};
        for (const item of dados.itens) {
          valoresIniciais[item.id] = String(item.quantidade);
        }
        setRecebidos(valoresIniciais);
      })
      .catch(() => setErro("Não foi possível carregar o pedido."))
      .finally(() => setCarregando(false));
  }, [id]);

  async function confirmar(e: React.FormEvent) {
    e.preventDefault();
    if (!pedido) return;

    setSalvando(true);
    setErro("");

    try {
      await registrarRecebimento(id, {
        data_recebimento: dataRecebimento,
        itens: pedido.itens.map((item) => ({
          item_id: item.id,
          quantidade_recebida: Number(recebidos[item.id]) || 0,
        })),
      });
      router.push("/pedidos-compra");
    } catch {
      setErro("Não foi possível registrar o recebimento.");
      setSalvando(false);
    }
  }

  return (
    <section className={styles.pagina}>
      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>Recebimento do pedido #{id}</h1>
          {pedido && (
            <p className={styles.subtitulo}>
              {pedido.fornecedor_nome} · pedido em {formatDate(pedido.data_pedido)} · entrega prometida{" "}
              {formatDate(pedido.data_prometida)}
            </p>
          )}
        </div>
        <Link href="/pedidos-compra" className={styles.botaoSecundario}>
          Voltar
        </Link>
      </div>

      {erro && <p className={styles.erro}>{erro}</p>}
      {carregando && <p className={styles.dica}>Carregando...</p>}

      {pedido && pedido.status !== "ABERTO" && (
        <p className={styles.sucesso}>Esse pedido já está como {pedido.status.toLowerCase()}.</p>
      )}

      {pedido && pedido.status === "ABERTO" && (
        <form className={styles.card} onSubmit={confirmar}>
          <label className={styles.campo} style={{ maxWidth: 240, marginBottom: 16 }}>
            Data do recebimento
            <input
              className={styles.input}
              type="date"
              value={dataRecebimento}
              onChange={(e) => setDataRecebimento(e.target.value)}
            />
          </label>

          <div className={styles.tabelaContainer}>
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Qtd. pedida</th>
                  <th>Qtd. recebida</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pedido.itens.map((item) => {
                  const recebido = Number(recebidos[item.id]) || 0;
                  return (
                    <tr key={item.id}>
                      <td>{item.produto_nome}</td>
                      <td>{item.quantidade}</td>
                      <td style={{ width: 160 }}>
                        <input
                          className={styles.input}
                          type="number"
                          min="0"
                          value={recebidos[item.id] ?? ""}
                          onChange={(e) => setRecebidos({ ...recebidos, [item.id]: e.target.value })}
                        />
                      </td>
                      <td>
                        {recebido < item.quantidade && (
                          <span className={`${styles.tag} ${styles.tagAmarela}`}>Faltando</span>
                        )}
                        {recebido > item.quantidade && (
                          <span className={`${styles.tag} ${styles.tagVermelha}`}>A mais</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.rodapeForm}>
            <button type="submit" className={styles.botao} disabled={salvando}>
              {salvando ? "Salvando..." : "Confirmar recebimento"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

// useParams lê o [id] da URL, que só existe em tempo de execução: precisa de Suspense.
export default function RecebimentoPage() {
  return (
    <Suspense fallback={<p style={{ padding: 24 }}>Carregando...</p>}>
      <RecebimentoConteudo />
    </Suspense>
  );
}
