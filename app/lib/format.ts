const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// timeZone fixo para o servidor e o navegador gerarem o mesmo texto.
const date = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

export const formatCurrency = (value: number) => currency.format(value);

/** Recebe "AAAA-MM-DD" e devolve "DD/MM/AAAA". */
export const formatDate = (iso: string) => date.format(new Date(`${iso}T00:00:00Z`));
