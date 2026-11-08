export interface Budget {
  id: string;
  periodId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  currencyCode: string;
  minorUnit: number;
  financialProfile: { id: string; name: string } | null;
  period: { month: string; startDate: string; endDateExclusive: string; timeZone: string };
  totals: {
    plannedMinor: string; coveredSpentMinor: string; remainingMinor: string;
    unbudgetedSpentMinor: string; totalExpensesMinor: string;
  };
  items: Array<{
    id: string;
    category: { id: string; name: string };
    plannedMinor: string; spentMinor: string; remainingMinor: string;
    isOverBudget: boolean;
  }>;
}

export interface BudgetsResponse {
  items: Budget[];
  month: string;
  timeZone: string;
  asOf: string;
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface BudgetOptions {
  profiles: Array<{ id: string; name: string }>;
  currencies: Array<{ code: string; name: string; minorUnit: number }>;
  categories: Array<{ id: string; name: string }>;
  timeZone: string;
}

export interface CreateBudgetPayload {
  name: string;
  month: string;
  currencyCode: string;
  financialProfileId: string | null;
  items: Array<{ categoryId: string; amountMinor: string }>;
}

export async function updateBudgetLimits(
  budgetId: string,
  periodId: string,
  items: Array<{ id: string; amountMinor: string }>,
): Promise<Budget> {
  let response: Response;
  try {
    response = await fetch(`/api/budgets/${encodeURIComponent(budgetId)}/periods/${encodeURIComponent(periodId)}/limits`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ items }),
    });
  } catch {
    throw new Error("Connexion interrompue. Actualisez la liste pour vérifier les plafonds enregistrés.");
  }
  if (!response.ok) {
    const data: { error?: { code?: string } } | null = await response.json().catch(() => null);
    const messages: Record<string, string> = {
      INVALID_BUDGET_LIMITS: "Saisissez des plafonds positifs ou nuls.",
      INVALID_BUDGET_ITEMS: "Les lignes ont changé. Fermez le formulaire et actualisez la liste.",
      BUDGET_PERIOD_NOT_FOUND: "Cette période budgétaire n’est plus disponible.",
      BUDGET_INACTIVE: "Ce budget est inactif.",
      BUDGET_PERIOD_UNSUPPORTED: "Cette période utilise un fuseau horaire qui n’est pas encore pris en charge.",
    };
    throw new Error(messages[data?.error?.code ?? ""] ?? "La modification n’a pas pu être confirmée. Actualisez la liste.");
  }
  try {
    const data: { item: Budget } = await response.json();
    return data.item;
  } catch {
    throw new Error("Réponse illisible. Actualisez la liste pour vérifier les plafonds enregistrés.");
  }
}

export async function fetchBudgets(month: string, page: number, signal: AbortSignal): Promise<BudgetsResponse> {
  const query = new URLSearchParams({ month, page: String(page), pageSize: "12" });
  const response = await fetch(`/api/budgets?${query}`, {
    signal, cache: "no-store", headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Impossible de charger les budgets. Vérifiez le mois choisi et le serveur.");
  return response.json();
}

export async function fetchBudgetOptions(signal: AbortSignal): Promise<BudgetOptions> {
  const response = await fetch("/api/budgets/options", {
    signal, cache: "no-store", headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Impossible de charger les profils, devises et catégories.");
  return response.json();
}

export async function createBudget(payload: CreateBudgetPayload): Promise<Budget> {
  let response: Response;
  try {
    response = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Connexion interrompue. Vérifiez la liste avant de réessayer : le budget a peut-être été créé.");
  }
  if (!response.ok) {
    const data: { error?: { code?: string } } | null = await response.json().catch(() => null);
    const messages: Record<string, string> = {
      INVALID_BUDGET: "Vérifiez le nom, le mois et les plafonds. Choisissez de 1 à 50 catégories différentes.",
      PROFILE_NOT_FOUND: "Ce profil n’est plus disponible. Fermez puis rouvrez le formulaire.",
      INVALID_CURRENCY: "Cette devise n’est plus disponible.",
      INVALID_BUDGET_CATEGORIES: "Une catégorie n’est plus disponible. Fermez puis rouvrez le formulaire.",
    };
    throw new Error(messages[data?.error?.code ?? ""] ?? "La création n’a pas pu être confirmée. Vérifiez la liste avant de réessayer.");
  }
  try {
    const data: { item: Budget } = await response.json();
    return data.item;
  } catch {
    throw new Error("Réponse illisible. Vérifiez la liste avant de réessayer pour éviter un doublon.");
  }
}
