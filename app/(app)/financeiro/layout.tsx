import SectionTabs from "@/app/components/layout/SectionTabs";
import { navSections } from "@/app/config/nav";
import styles from "./financeiro.module.css";

const financeiro = navSections
  .flatMap((s) => s.items)
  .find((item) => item.href === "/financeiro")!;

// Layout aninhado: envolve /financeiro/contas-a-pagar e /financeiro/contas-a-receber.
// Fica montado ao trocar de aba — só o conteúdo de {children} é substituído.
export default function FinanceiroLayout({ children }: LayoutProps<"/financeiro">) {
  return (
    <div className={styles.section}>
      <header className={styles.header}>
        <h1>Financeiro</h1>
        <p>Acompanhe o que a empresa tem a pagar e a receber.</p>
      </header>
      <SectionTabs label="Seções do financeiro" items={financeiro.children ?? []} />
      <div className={styles.body}>{children}</div>
    </div>
  );
}
