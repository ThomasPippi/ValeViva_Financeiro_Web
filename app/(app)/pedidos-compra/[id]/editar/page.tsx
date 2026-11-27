"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import styles from "@/app/styles/paginas.module.css";
import { atualizarPedido, buscarPedido, type PedidoCompra } from "@/app/lib/pedidosCompra";
import PedidoForm from "../../_components/PedidoForm";

function EditarPedidoConteudo() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [pedido, setPedido] = useState<PedidoCompra | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    buscarPedido(id)
      .then((dados) => setPedido(dados))
      .catch(() => setErro("Não foi possível carregar o pedido."))
      .finally(() => setCarregando(false));
  }, [id]);

  return (
    <section className={styles.pagina}>
      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>Editar pedido #{id}</h1>
          <p className={styles.subtitulo}>Altere o fornecedor, a entrega prometida ou os itens</p>
        </div>
        <Link href="/pedidos-compra" className={styles.botaoSecundario}>
          Voltar
        </Link>
      </div>

      {carregando && <p className={styles.vazio}>Carregando...</p>}
      {erro && <p className={styles.erro}>{erro}</p>}

      {/* o backend só aceita alterar pedidos em aberto */}
      {pedido && pedido.status !== "ABERTO" && (
        <p className={styles.erro}>
          Este pedido está {pedido.status === "RECEBIDO" ? "recebido" : "cancelado"} e não pode mais ser
          alterado.
        </p>
      )}

      {pedido && pedido.status === "ABERTO" && (
        <PedidoForm
          pedido={pedido}
          textoBotao="Salvar alterações"
          onSalvar={async (dados) => {
            await atualizarPedido(id, dados);
            router.push("/pedidos-compra");
          }}
        />
      )}
    </section>
  );
}

// useParams lê o [id] da URL, que só existe em tempo de execução: precisa de Suspense.
export default function EditarPedidoPage() {
  return (
    <Suspense fallback={<p style={{ padding: 24 }}>Carregando...</p>}>
      <EditarPedidoConteudo />
    </Suspense>
  );
}
