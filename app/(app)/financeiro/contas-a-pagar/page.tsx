import type { Metadata } from "next";
import LancamentosView from "../_components/LancamentosView";
import { contasAPagar } from "../_lib/mock";

export const metadata: Metadata = { title: "Contas a pagar" };

export default function ContasAPagarPage() {
  return (
    <LancamentosView itens={contasAPagar} contraparteLabel="Fornecedor" pagoLabel="Pago" />
  );
}
