import { redirect } from "next/navigation";

// /financeiro não tem conteúdo próprio: abre a primeira aba.
export default function FinanceiroPage() {
  redirect("/financeiro/contas-a-pagar");
}
