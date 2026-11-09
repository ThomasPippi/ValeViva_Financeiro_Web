import { formatCurrency, formatDate } from "@/app/lib/format";
import { somaPorStatus, type Lancamento, type Status } from "../_lib/mock";
import styles from "../financeiro.module.css";

const statusLabel: Record<Status, string> = {
  pendente: "Pendente",
  pago: "Pago",
  atrasado: "Atrasado",
};

type Props = {
  itens: Lancamento[];
  contraparteLabel: string;
  pagoLabel: string;
};

export default function LancamentosView({ itens, contraparteLabel, pagoLabel }: Props) {
  const soma = somaPorStatus(itens);

  return (
    <>
      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <span>Total do período</span>
          <strong>{formatCurrency(soma.total)}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span>Pendente</span>
          <strong>{formatCurrency(soma.pendente)}</strong>
        </div>
        <div className={styles.summaryCard} data-tone="danger">
          <span>Atrasado</span>
          <strong>{formatCurrency(soma.atrasado)}</strong>
        </div>
        <div className={styles.summaryCard} data-tone="success">
          <span>{pagoLabel}</span>
          <strong>{formatCurrency(soma.pago)}</strong>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Descrição</th>
              <th>{contraparteLabel}</th>
              <th>Vencimento</th>
              <th className={styles.num}>Valor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item) => (
              <tr key={item.id}>
                <td className={styles.muted}>{item.id}</td>
                <td>{item.descricao}</td>
                <td className={styles.muted}>{item.contraparte}</td>
                <td>{formatDate(item.vencimento)}</td>
                <td className={styles.num}>{formatCurrency(item.valor)}</td>
                <td>
                  <span className={styles.badge} data-status={item.status}>
                    {item.status === "pago" ? pagoLabel : statusLabel[item.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
