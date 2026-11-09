import type { Metadata } from "next";
import LancamentosView from "../_components/LancamentosView";
import { contasAReceber } from "../_lib/mock";

export const metadata: Metadata = { title: "Contas a receber" };

export default function ContasAReceberPage() {
  return (
    <LancamentosView itens={contasAReceber} contraparteLabel="Cliente" pagoLabel="Recebido" />
  );
}
