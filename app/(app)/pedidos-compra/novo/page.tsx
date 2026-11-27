"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "@/app/styles/paginas.module.css";
import { cadastrarPedido } from "@/app/lib/pedidosCompra";
import PedidoForm from "../_components/PedidoForm";

export default function NovoPedidoPage() {
  const router = useRouter();

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

      <PedidoForm
        textoBotao="Salvar pedido"
        onSalvar={async (dados) => {
          await cadastrarPedido(dados);
          router.push("/pedidos-compra");
        }}
      />
    </section>
  );
}
