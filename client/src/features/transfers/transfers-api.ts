export interface Transfer {
  id: string;
  description: string | null;
  status: "PENDING" | "POSTED" | "CANCELLED";
  sourceAmountMinor: string;
  destinationAmountMinor: string;
  sourceCurrencyCode: string;
  destinationCurrencyCode: string;
  sourceMinorUnit: number;
  destinationMinorUnit: number;
  exchangeRate: string;
  transferDate: string;
  postedAt: string | null;
  sourceAccount: { id: string; name: string };
  destinationAccount: { id: string; name: string };
}

export interface TransfersResponse {
  items: Transfer[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface TransferAccount {
  id: string;
  name: string;
  type: string;
  currencyCode: string;
  minorUnit: number;
  openingBalanceDate: string;
  financialProfile: { id: string; name: string };
}

export interface CreateTransferPayload {
  sourceAccountId: string;
  destinationAccountId: string;
  amountMinor: string;
  transferDate: string;
  description?: string;
}

export async function cancelTransfer(transferId: string): Promise<Transfer> {
  let response: Response;
  try {
    response = await fetch(`/api/transfers/${encodeURIComponent(transferId)}/cancel`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({}),
    });
  } catch {
    throw new Error("Connexion interrompue. Actualisez la liste pour vérifier si le virement a été annulé.");
  }

  if (!response.ok) {
    const data: { error?: { code?: string } } | null = await response.json().catch(() => null);
    const messages: Record<string, string> = {
      TRANSFER_NOT_FOUND: "Ce virement n’est plus disponible.",
      TRANSFER_NOT_CANCELLABLE: "Ce virement ne peut pas être annulé depuis cette page.",
      TRANSFER_LINKED: "Ce virement comporte des frais ou un remboursement de dette lié. Il ne peut pas être annulé séparément.",
      INVALID_TRANSFER_CANCELLATION: "La demande d’annulation est invalide.",
    };
    throw new Error(messages[data?.error?.code ?? ""] ?? "L’annulation n’a pas pu être confirmée. Actualisez la liste.");
  }

  try {
    const data: { item: Transfer } = await response.json();
    return data.item;
  } catch {
    throw new Error("Réponse illisible. Actualisez la liste pour vérifier le statut du virement.");
  }
}

export async function fetchTransfers(page: number, signal: AbortSignal): Promise<TransfersResponse> {
  const query = new URLSearchParams({ page: String(page), pageSize: "12" });
  const response = await fetch(`/api/transfers?${query}`, {
    signal,
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Impossible de charger les virements. Vérifiez que le serveur est démarré.");
  return response.json();
}

export async function fetchTransferOptions(signal: AbortSignal): Promise<{ accounts: TransferAccount[] }> {
  const response = await fetch("/api/transfers/options", {
    signal,
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Impossible de charger les comptes disponibles.");
  return response.json();
}

export async function createTransfer(payload: CreateTransferPayload): Promise<Transfer> {
  let response: Response;
  try {
    response = await fetch("/api/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Connexion interrompue. Vérifiez la liste avant de réessayer : le virement a peut-être été enregistré.");
  }
  if (!response.ok) {
    const data: { error?: { code?: string } } | null = await response.json().catch(() => null);
    const messages: Record<string, string> = {
      INVALID_TRANSFER: "Vérifiez les comptes, le montant et la date du virement.",
      SAME_TRANSFER_ACCOUNT: "Choisissez deux comptes différents.",
      TRANSFER_ACCOUNT_NOT_FOUND: "Un des comptes n’est plus disponible. Fermez puis rouvrez le formulaire.",
      TRANSFER_ACCOUNT_UNAVAILABLE: "Les deux comptes, leurs profils et leurs devises doivent être actifs.",
      TRANSFER_CURRENCY_MISMATCH: "Choisissez deux comptes de même devise.",
      INVALID_TRANSFER_DATE: "La date doit être valide et ne peut pas être dans le futur.",
      TRANSFER_BEFORE_OPENING: "La date doit être postérieure ou égale au début du suivi des deux comptes.",
    };
    throw new Error(messages[data?.error?.code ?? ""] ?? "L’enregistrement n’a pas pu être confirmé. Vérifiez la liste avant de réessayer.");
  }
  try {
    const data: { item: Transfer } = await response.json();
    return data.item;
  } catch {
    throw new Error("Réponse illisible. Vérifiez la liste avant de réessayer pour éviter un doublon.");
  }
}
