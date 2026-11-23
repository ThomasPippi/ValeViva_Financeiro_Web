import type { Metadata } from "next";
import Link from "next/link";
import styles from "./expedicao.module.css";

export const metadata: Metadata = { title: "Expedição" };

export default function ExpedicaoPage() {
 

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Expedição</h1>
        <p>Exemplo Expedição</p>
      </header>

    </div>
  );
}
