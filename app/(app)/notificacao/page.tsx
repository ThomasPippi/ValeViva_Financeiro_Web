import type { Metadata } from "next";
import styles from "./notificacao.module.css";

export const metadata: Metadata = { title: "Notificação" };

export default function NotificacaoPage() {
 

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Notificação</h1>
        <p>Exemplo Notificação</p>
      </header>

    </div>
  );
}
