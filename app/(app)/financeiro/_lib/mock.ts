// Dados de exemplo — substituir pela fonte real (API/banco).

export type Status = "pendente" | "pago" | "atrasado";

export type Lancamento = {
  id: string;
  descricao: string;
  contraparte: string;
  vencimento: string; // AAAA-MM-DD
  valor: number;
  status: Status;
};

export const contasAPagar: Lancamento[] = [
  { id: "P-1042", descricao: "Aluguel do escritório", contraparte: "Imobiliária Central", vencimento: "2026-11-10", valor: 4800, status: "pendente" },
  { id: "P-1041", descricao: "Energia elétrica", contraparte: "Distribuidora de Energia", vencimento: "2026-11-05", valor: 612.37, status: "atrasado" },
  { id: "P-1040", descricao: "Licenças de software", contraparte: "Fornecedor SaaS", vencimento: "2026-11-03", valor: 1290, status: "pago" },
  { id: "P-1039", descricao: "Serviços de contabilidade", contraparte: "Escritório Contábil", vencimento: "2026-11-15", valor: 2150, status: "pendente" },
  { id: "P-1038", descricao: "Internet e telefonia", contraparte: "Operadora Telecom", vencimento: "2026-11-01", valor: 389.9, status: "pago" },
];

export const contasAReceber: Lancamento[] = [
  { id: "R-2210", descricao: "Mensalidade — plano anual", contraparte: "Cliente Alfa", vencimento: "2026-11-12", valor: 7500, status: "pendente" },
  { id: "R-2209", descricao: "Consultoria outubro", contraparte: "Cliente Beta", vencimento: "2026-11-02", valor: 3200, status: "pago" },
  { id: "R-2208", descricao: "Implantação de sistema", contraparte: "Cliente Gama", vencimento: "2026-10-28", valor: 12400, status: "atrasado" },
  { id: "R-2207", descricao: "Mensalidade — plano mensal", contraparte: "Cliente Delta", vencimento: "2026-11-20", valor: 890, status: "pendente" },
];

export function somaPorStatus(itens: Lancamento[]) {
  const total = (s?: Status) =>
    itens.filter((i) => !s || i.status === s).reduce((acc, i) => acc + i.valor, 0);
  return {
    total: total(),
    pendente: total("pendente"),
    atrasado: total("atrasado"),
    pago: total("pago"),
  };
}
