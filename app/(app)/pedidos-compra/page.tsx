"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "@/app/styles/paginas.module.css";
import { formatCurrency, formatDate } from "@/app/lib/format";
import { buscarPedidos, estaAtrasado, totalPedido, type PedidoCompra } from "@/app/lib/pedidosCompra";

export default function PedidosCompraPage() {
  const [pedidos, setPedidos] = useState<PedidoCompra[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [somenteAtrasados, setSomenteAtrasados] = useState(false);

  useEffect(() => {
    buscarPedidos()
      .then((lista) => setPedidos(lista))
      .catch(() => setErro("Não foi possível carregar os pedidos."))
      .finally(() => setCarregando(false));
  }, []);

  let pedidosFiltrados = pedidos;
  if (somenteAtrasados) {
    pedidosFiltrados = pedidos.filter((pedido) => estaAtrasado(pedido));
  }

  // quantidade de atrasados pra mostrar no filtro
  const qtdAtrasados = pedidos.filter((pedido) => estaAtrasado(pedido)).length;

  function mostrarStatus(pedido: PedidoCompra) {
    if (estaAtrasado(pedido)) {
      return <span className={`${styles.tag} ${styles.tagVermelha}`}>Atrasado</span>;
    }
    if (pedido.status === "RECEBIDO") {
      return <span className={`${styles.tag} ${styles.tagVerde}`}>Recebido</span>;
    }
    if (pedido.status === "CANCELADO") {
      return <span className={styles.tag}>Cancelado</span>;
    }
    return <span className={`${styles.tag} ${styles.tagAmarela}`}>Aberto</span>;
  }

  return (
    <section className={styles.pagina}>
      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>Pedidos de compra</h1>
          <p className={styles.subtitulo}>Acompanhe os pedidos feitos aos fornecedores</p>
        </div>
        <Link href="/pedidos-compra/novo" className={styles.botao}>
          + Novo pedido
        </Link>
      </div>

      <div className={styles.filtros}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={somenteAtrasados}
            onChange={(e) => setSomenteAtrasados(e.target.checked)}
          />
          Mostrar só atrasados ({qtdAtrasados})
        </label>
      </div>

      {erro && <p className={styles.erro}>{erro}</p>}

      <div className={styles.tabelaContainer}>
        <table className={styles.tabela}>
          <thead>
            <tr>
              <th>Nº</th>
              <th>Fornecedor</th>
              <th>Data do pedido</th>
              <th>Entrega prometida</th>
              <th>Total</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pedidosFiltrados.map((pedido) => (
              <tr key={pedido.id}>
                <td>#{pedido.id}</td>
                <td>{pedido.fornecedor_nome}</td>
                <td>{formatDate(pedido.data_pedido)}</td>
                <td>{formatDate(pedido.data_prometida)}</td>
                <td>{formatCurrency(totalPedido(pedido))}</td>
                <td>{mostrarStatus(pedido)}</td>
                <td>
                  {pedido.status === "ABERTO" && (
                    <Link href={`/pedidos-compra/${pedido.id}/recebimento`} className={styles.botaoPequeno}>
                      Receber
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {carregando && <p className={styles.vazio}>Carregando...</p>}
        {!carregando && pedidosFiltrados.length === 0 && (
          <p className={styles.vazio}>Nenhum pedido encontrado.</p>
        )}
      </div>
    </section>
  );
}
