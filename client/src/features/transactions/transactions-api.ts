export type EntryType = "INCOME" | "EXPENSE";
export type TransactionFilter = "ALL" | EntryType;

export interface Transaction {
  id: string;
  type: EntryType | "ADJUSTMENT";
  status: "PENDING" | "POSTED" | "CANCELLED";
  description: string;
  merchant: string | null;
  amountMinor: string;
  currencyCode: string;
  minorUnit: number;
  transactionDate: string;
  postedAt: string | null;
  account: { id: string; name: string };
  financialProfile: { id: string; name: string };
  category: { id: string; name: string; type: EntryType } | null;
}

export interface TransactionsResponse {
  items: Transaction[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface TransactionOptions {
  profiles: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string; type: EntryType }>;
  accounts: Array<{
    id: string;
    name: string;
    type: string;
    financialProfileId: string;
    currencyCode: string;
    minorUnit: number;
    openingBalanceDate: string;
  }>;
}

export interface CreateTransactionPayload {
  accountId: string;
  financialProfileId: string;
  categoryId: string;
  type: EntryType;
  description: string;
  merchant?: string;
  amountMinor: string;
  transactionDate: string;
}

export async function cancelTransaction(transactionId: string): Promise<Transaction> {
  let response: Response;
  try {
    response = await fetch(`/api/transactions/${encodeURIComponent(transactionId)}/cancel`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({}),
    });
  } catch {
    throw new Error("Connexion interrompue. Actualisez la liste pour vérifier si la transaction a été annulée.");
  }

  if (!response.ok) {
    const data: { error?: { code?: string } } | null = await response.json().catch(() => null);
    const messages: Record<string, string> = {
      TRANSACTION_NOT_FOUND: "Cette transaction n’est plus disponible.",
      TRANSACTION_LINKED: "Cette transaction dépend d’un virement ou d’une opération récurrente. Elle ne peut pas être annulée séparément.",
      TRANSACTION_NOT_CANCELLABLE: "Cette transaction ne peut pas être annulée depuis cette page.",
      INVALID_TRANSACTION_CANCELLATION: "La demande d’annulation est invalide.",
    };
    throw new Error(messages[data?.error?.code ?? ""] ?? "L’annulation n’a pas pu être confirmée. Actualisez la liste.");
  }

  try {
    const data: { item: Transaction } = await response.json();
    return data.item;
  } catch {
    throw new Error("Réponse illisible. Actualisez la liste pour vérifier le statut de la transaction.");
  }
}

export async function fetchTransactions(
  page: number,
  filter: TransactionFilter,
  signal: AbortSignal,
): Promise<TransactionsResponse> {
  const query = new URLSearchParams({ page: String(page), pageSize: "12" });
  if (filter !== "ALL") query.set("type", filter);
  const response = await fetch(`/api/transactions?${query}`, {
    signal,
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Impossible de charger les transactions. Vérifiez que le serveur est démarré.");
  return response.json();
}

export async function fetchTransactionOptions(signal: AbortSignal): Promise<TransactionOptions> {
  const response = await fetch("/api/transactions/options", {
    signal,
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Impossible de charger les comptes, profils et catégories.");
  return response.json();
}

export async function createTransaction(payload: CreateTransactionPayload): Promise<Transaction> {
  let response: Response;
  try {
    response = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Connexion interrompue. Vérifiez la liste avant de réessayer : la transaction a peut-être été enregistrée.");
  }

  if (!response.ok) {
    const data: { error?: { code?: string } } | null = await response.json().catch(() => null);
    const messages: Record<string, string> = {
      INVALID_TRANSACTION: "Vérifiez le montant, la date et les informations saisies.",
      ACCOUNT_NOT_FOUND: "Ce compte n’est plus disponible. Fermez puis rouvrez le formulaire.",
      ACCOUNT_UNAVAILABLE: "Le compte, son profil et sa devise doivent être actifs.",
      PROFILE_NOT_FOUND: "Le profil choisi n’est plus disponible.",
      CATEGORY_NOT_FOUND: "La catégorie choisie n’est plus disponible.",
      CATEGORY_TYPE_MISMATCH: "Choisissez une catégorie correspondant au type de transaction.",
      INVALID_TRANSACTION_DATE: "La date doit être valide et ne peut pas être dans le futur.",
      TRANSACTION_BEFORE_OPENING: "La date doit être postérieure ou égale au début du suivi du compte.",
    };
    throw new Error(messages[data?.error?.code ?? ""] ?? "L’enregistrement n’a pas pu être confirmé. Vérifiez la liste avant de réessayer.");
  }

  try {
    const data: { item: Transaction } = await response.json();
    return data.item;
  } catch {
    throw new Error("Réponse illisible. Vérifiez la liste avant de réessayer pour éviter un doublon.");
  }
}
