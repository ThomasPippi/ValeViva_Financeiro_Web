import type { Metadata } from "next";
import Link from "next/link";
import { formatCurrency } from "@/app/lib/format";
import { contasAPagar, contasAReceber, somaPorStatus } from "../financeiro/_lib/mock";
import styles from "./dashboard.module.css";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  const pagar = somaPorStatus(contasAPagar);
  const receber = somaPorStatus(contasAReceber);
  const aPagar = pagar.pendente + pagar.atrasado;
  const aReceber = receber.pendente + receber.atrasado;

  const stats = [
    { label: "Recebido no mês", value: receber.pago, tone: "success" },
    { label: "Pago no mês", value: pagar.pago },
    { label: "A receber", value: aReceber },
    { label: "A pagar", value: aPagar, tone: "danger" },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Dashboard</h1>
        <p>Visão geral do financeiro de novembro/2026 (dados de exemplo).</p>
      </header>

      <section className={styles.stats} aria-label="Indicadores">
        {stats.map((s) => (
          <div key={s.label} className={styles.stat} data-tone={s.tone}>
            <span>{s.label}</span>
            <strong>{formatCurrency(s.value)}</strong>
          </div>
        ))}
      </section>

      <section className={styles.shortcuts} aria-label="Atalhos">
        <Link href="/financeiro/contas-a-pagar" className={styles.shortcut}>
          <strong>Contas a pagar</strong>
          <span>
            {contasAPagar.length} lançamentos · {formatCurrency(aPagar)} em aberto
          </span>
        </Link>
        <Link href="/financeiro/contas-a-receber" className={styles.shortcut}>
          <strong>Contas a receber</strong>
          <span>
            {contasAReceber.length} lançamentos · {formatCurrency(aReceber)} em aberto
          </span>
        </Link>
      </section>
    </div>
  );
}
