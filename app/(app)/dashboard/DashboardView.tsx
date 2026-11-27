"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDate } from "@/app/lib/format";
import { listarNotificacoes, type Notificacao } from "@/app/lib/notificacoes";
import { listarOrdensProducao, type OrdemProducao } from "@/app/lib/ordens";
import { buscarPedidos, estaAtrasado, hojeISO, type PedidoCompra } from "@/app/lib/pedidosCompra";
import { buscarProdutos, type Produto } from "@/app/lib/produtos";
import styles from "./dashboard.module.css";

// Cada fonte é null quando a chamada falhou: o resto do painel continua aparecendo.
type Dados = {
  ordens: OrdemProducao[] | null;
  produtos: Produto[] | null;
  pedidos: PedidoCompra[] | null;
  notificacoes: Notificacao[] | null;
  /** Data de hoje (yyyy-mm-dd), lida no navegador junto com os dados. */
  hoje: string;
};

const STATUS_ORDEM: Record<string, string> = {
  EMITIDA: "Emitida",
  AGUARDANDO_MATERIAIS: "Aguardando materiais",
  LIBERADA: "Liberada",
  EM_PRODUCAO: "Em produção",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

const LIMITE_LISTA = 5;

function ordemEmAndamento(ordem: OrdemProducao) {
  return ordem.status !== "CONCLUIDA" && ordem.status !== "CANCELADA";
}

function ordemAtrasada(ordem: OrdemProducao, hoje: string) {
  return ordemEmAndamento(ordem) && !!ordem.prazo && ordem.prazo.slice(0, 10) < hoje;
}

function estoqueBaixo(produto: Produto) {
  return produto.is_ativo && produto.quantidade_estoque < produto.estoque_minimo;
}

function valor<T>(resultado: PromiseSettledResult<T>) {
  return resultado.status === "fulfilled" ? resultado.value : null;
}

async function carregarDados(): Promise<Dados> {
  const [ordens, produtos, pedidos, notificacoes] = await Promise.allSettled([
    listarOrdensProducao(),
    buscarProdutos(),
    buscarPedidos(),
    listarNotificacoes(),
  ]);
  return {
    ordens: valor(ordens),
    produtos: valor(produtos),
    pedidos: valor(pedidos),
    notificacoes: valor(notificacoes),
    hoje: hojeISO(),
  };
}

export default function DashboardView() {
  const [dados, setDados] = useState<Dados | null>(null);

  useEffect(() => {
    let ativo = true;
    carregarDados().then((resultado) => {
      if (ativo) setDados(resultado);
    });
    return () => {
      ativo = false;
    };
  }, []);

  // new Date() não pode rodar no render (prerender com cacheComponents)
  const hoje = dados?.hoje ?? "";
  const carregando = dados === null;

  // ---------- Ordens de produção ----------
  const ordensAbertas = (dados?.ordens ?? [])
    .filter(ordemEmAndamento)
    .sort((a, b) => (a.prazo ?? "").localeCompare(b.prazo ?? "") || b.prioridade - a.prioridade);
  const qtdOrdensAtrasadas = ordensAbertas.filter((o) => ordemAtrasada(o, hoje)).length;

  // ---------- Estoque ----------
  // os mais críticos primeiro: menor proporção estoque / mínimo
  const produtosBaixos = (dados?.produtos ?? [])
    .filter(estoqueBaixo)
    .sort((a, b) => a.quantidade_estoque / a.estoque_minimo - b.quantidade_estoque / b.estoque_minimo);

  // ---------- Compras ----------
  const pedidosAbertos = (dados?.pedidos ?? [])
    .filter((p) => p.status === "ABERTO")
    .sort((a, b) => a.data_prometida.localeCompare(b.data_prometida));
  const qtdPedidosAtrasados = pedidosAbertos.filter(estaAtrasado).length;

  // ---------- Notificações ----------
  const qtdNaoLidas = (dados?.notificacoes ?? []).filter((n) => !n.lida).length;

  const falhas = dados
    ? [
        !dados.ordens && "ordens de produção",
        !dados.produtos && "produtos",
        !dados.pedidos && "pedidos de compra",
        !dados.notificacoes && "notificações",
      ].filter(Boolean)
    : [];

  // "—" enquanto carrega ou quando a fonte falhou
  const numero = (fonte: unknown[] | null | undefined, n: number) => (fonte ? n : "—");

  const indicadores = [
    {
      label: "Ordens em andamento",
      value: numero(dados?.ordens, ordensAbertas.length),
      href: "/ordem-producao",
    },
    {
      label: "Ordens atrasadas",
      value: numero(dados?.ordens, qtdOrdensAtrasadas),
      href: "/ordem-producao",
      tone: qtdOrdensAtrasadas > 0 ? "danger" : undefined,
    },
    {
      label: "Abaixo do estoque mínimo",
      value: numero(dados?.produtos, produtosBaixos.length),
      href: "/produtos",
      tone: produtosBaixos.length > 0 ? "warning" : undefined,
    },
    {
      label: "Compras atrasadas",
      value: numero(dados?.pedidos, qtdPedidosAtrasados),
      href: "/pedidos-compra",
      tone: qtdPedidosAtrasados > 0 ? "danger" : undefined,
    },
    {
      label: "Notificações não lidas",
      value: numero(dados?.notificacoes, qtdNaoLidas),
      href: "/notificacoes?filtro=nao-lidas",
    },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Dashboard</h1>
        <p>Visão geral da produção, do estoque e das compras.</p>
      </header>

      {falhas.length > 0 && (
        <p className={styles.alerta} role="alert">
          Não foi possível carregar: {falhas.join(", ")}. Verifique se o backend está rodando.
        </p>
      )}

      <section className={styles.stats} aria-label="Indicadores">
        {indicadores.map((s) => (
          <Link key={s.label} href={s.href} className={styles.stat} data-tone={s.tone}>
            <span>{s.label}</span>
            <strong>{s.value}</strong>
          </Link>
        ))}
      </section>

      <div className={styles.panels}>
        {/* ---------- Ordens de produção ---------- */}
        <section className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2>Próximas ordens de produção</h2>
            <Link href="/ordem-producao">Ver todas</Link>
          </header>
          <Lista
            carregando={carregando}
            falhou={!!dados && !dados.ordens}
            vazio="Nenhuma ordem em andamento."
            itens={ordensAbertas.slice(0, LIMITE_LISTA).map((ordem) => ({
              key: ordem.id,
              titulo: `${ordem.numero ?? `#${ordem.id}`} · ${ordem.descricaoProduto ?? ordem.codigoProduto ?? "Produto"}`,
              detalhe: `${ordem.quantidade} un · ${STATUS_ORDEM[ordem.status] ?? ordem.status}`,
              lateral: ordem.prazo ? formatDate(ordem.prazo.slice(0, 10)) : "—",
              tom: ordemAtrasada(ordem, hoje) ? "danger" : undefined,
            }))}
          />
        </section>

        {/* ---------- Estoque ---------- */}
        <section className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2>Estoque abaixo do mínimo</h2>
            <Link href="/produtos">Ver produtos</Link>
          </header>
          <Lista
            carregando={carregando}
            falhou={!!dados && !dados.produtos}
            vazio="Todos os produtos estão acima do estoque mínimo."
            itens={produtosBaixos.slice(0, LIMITE_LISTA).map((produto) => ({
              key: produto.id,
              titulo: `${produto.codigo} · ${produto.nome}`,
              detalhe: `Mínimo: ${produto.estoque_minimo} ${produto.unidade}`,
              lateral: `${produto.quantidade_estoque} ${produto.unidade}`,
              tom: produto.quantidade_estoque === 0 ? "danger" : "warning",
            }))}
          />
        </section>

        {/* ---------- Compras ---------- */}
        <section className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2>Entregas de compra previstas</h2>
            <Link href="/pedidos-compra">Ver pedidos</Link>
          </header>
          <Lista
            carregando={carregando}
            falhou={!!dados && !dados.pedidos}
            vazio="Nenhum pedido de compra em aberto."
            itens={pedidosAbertos.slice(0, LIMITE_LISTA).map((pedido) => ({
              key: pedido.id,
              titulo: `#${pedido.id} · ${pedido.fornecedor_nome}`,
              detalhe: `${pedido.itens.length} ${pedido.itens.length === 1 ? "item" : "itens"}${
                estaAtrasado(pedido) ? " · atrasado" : ""
              }`,
              lateral: formatDate(pedido.data_prometida),
              tom: estaAtrasado(pedido) ? "danger" : undefined,
            }))}
          />
        </section>
      </div>

      <section className={styles.shortcuts} aria-label="Atalhos">
        <Link href="/ordem-producao?view=nova" className={styles.shortcut}>
          <strong>Nova ordem de produção</strong>
          <span>Emitir uma OP e verificar a necessidade de materiais</span>
        </Link>
        <Link href="/pedidos-compra/novo" className={styles.shortcut}>
          <strong>Novo pedido de compra</strong>
          <span>Comprar matéria-prima e componentes de um fornecedor</span>
        </Link>
        <Link href="/materia-prima/estoque" className={styles.shortcut}>
          <strong>Estoque e lotes</strong>
          <span>Registrar entradas e consultar saldos por lote</span>
        </Link>
      </section>
    </div>
  );
}

type ItemLista = {
  key: number;
  titulo: string;
  detalhe: string;
  lateral: string;
  tom?: "danger" | "warning";
};

function Lista({
  itens,
  carregando,
  falhou,
  vazio,
}: {
  itens: ItemLista[];
  carregando: boolean;
  falhou: boolean;
  vazio: string;
}) {
  if (carregando) return <p className={styles.panelEmpty}>Carregando...</p>;
  if (falhou) return <p className={styles.panelEmpty}>Não foi possível carregar.</p>;
  if (itens.length === 0) return <p className={styles.panelEmpty}>{vazio}</p>;

  return (
    <ul className={styles.list}>
      {itens.map((item) => (
        <li key={item.key} className={styles.row}>
          <div className={styles.rowMain}>
            <strong>{item.titulo}</strong>
            <span>{item.detalhe}</span>
          </div>
          <span className={styles.rowSide} data-tone={item.tom}>
            {item.lateral}
          </span>
        </li>
      ))}
    </ul>
  );
}
