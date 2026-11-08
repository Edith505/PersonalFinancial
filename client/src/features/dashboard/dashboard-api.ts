export interface DashboardData {
  asOf: string;
  period: { month: string; timeZone: string; start: string; endExclusive: string };
  currency: { code: string; name: string; minorUnit: number };
  currencies: Array<{ code: string; name: string; minorUnit: number }>;
  accountCount: number;
  balances: { netBalanceMinor: string; savingsMinor: string; creditOutstandingMinor: string };
  activity: { incomeMinor: string; expensesMinor: string };
  cashFlow: Array<{ month: string; incomeMinor: string; expensesMinor: string }>;
  recentTransactions: Array<{
    id: string; description: string; type: "INCOME" | "EXPENSE";
    amountMinor: string; transactionDate: string; accountName: string;
  }>;
}

export async function fetchDashboard(month: string, currencyCode: string, signal: AbortSignal): Promise<DashboardData> {
  const query = new URLSearchParams({ month });
  if (currencyCode) query.set("currencyCode", currencyCode);
  const response = await fetch(`/api/dashboard?${query}`, {
    signal, cache: "no-store", headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(response.status === 400
    ? "Choisissez un mois non futur et une devise disponible."
    : "Impossible de charger le tableau de bord. Vérifiez que le serveur est démarré.");
  return response.json();
}
