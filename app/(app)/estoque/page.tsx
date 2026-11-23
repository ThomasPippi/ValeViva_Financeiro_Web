import type { Metadata } from "next";
import Link from "next/link";
import { formatCurrency } from "@/app/lib/format";
import { contasAPagar, contasAReceber, somaPorStatus } from "../financeiro/_lib/mock";
import styles from "./estoque.module.css";

export const metadata: Metadata = { title: "Estoque" };

export default function EstoquePage() {
 

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Estoque</h1>
        <p>Exemplo Estoque</p>
      </header>

    </div>
  );
}
