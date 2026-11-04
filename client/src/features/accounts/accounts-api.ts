export type AccountType =
  | "CHECKING"
  | "SAVINGS"
  | "CASH"
  | "CREDIT"
  | "LIABILITY"
  | "INVESTMENT"
  | "MOBILE_MONEY"
  | "OTHER";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currencyCode: string;
  minorUnit: number;
  balanceMinor: string;
  isActive: boolean;
  financialProfile: {
    id: string;
    name: string;
  };
}

export interface AccountsResponse {
  items: Account[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  asOf: string;
}

export async function fetchAccounts(
  page: number,
  signal: AbortSignal,
): Promise<AccountsResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: "12",
  });

  const response = await fetch(`/api/accounts?${params}`, {
    signal,
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      "Impossible de charger les comptes. Vérifiez que le serveur est démarré.",
    );
  }

  return response.json();
}

export interface AccountOptions {
  profiles: Array<{
    id: string;
    name: string;
  }>;
  currencies: Array<{
    code: string;
    name: string;
    minorUnit: number;
  }>;
}

export interface CreateAccountPayload {
  financialProfileId: string;
  name: string;
  type: AccountType;
  currencyCode: string;
  openingBalanceMinor: string;
  openingBalanceDate: string;
  creditLimitMinor?: string;
}

export async function fetchAccountOptions(
  signal: AbortSignal,
): Promise<AccountOptions> {
  const response = await fetch("/api/accounts/options", {
    signal,
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("Impossible de charger les profils et les devises.");
  }

  return response.json();
}

export async function createAccount(
  payload: CreateAccountPayload,
): Promise<Account> {
  let response: Response;

  try {
    response = await fetch("/api/accounts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(
      "Connexion interrompue. Actualisez la liste avant de réessayer : le compte a peut-être été créé.",
    );
  }

  if (!response.ok) {
    const messages: Record<number, string> = {
      400: "Vérifiez les données saisies et la disponibilité de la devise.",
      404: "Ce profil n’est plus disponible. Fermez puis rouvrez le formulaire.",
    };

    throw new Error(
      messages[response.status] ??
        "La création n’a pas pu être confirmée. Actualisez la liste avant de réessayer.",
    );
  }

  try {
    const data: { item: Account } = await response.json();
    return data.item;
  } catch {
    throw new Error(
      "Réponse illisible. Actualisez la liste pour vérifier si le compte a été créé.",
    );
  }
}

export async function changeAccountStatus(
  accountId: string,
  isActive: boolean,
): Promise<{ id: string; isActive: boolean }> {
  let response: Response;

  try {
    response = await fetch(
      `/api/accounts/${encodeURIComponent(accountId)}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ isActive }),
      },
    );
  } catch {
    throw new Error(
      "Connexion interrompue. Actualisez la liste pour vérifier le statut du compte.",
    );
  }

  if (!response.ok) {
    if (response.status === 409) {
      throw new Error(
        isActive
          ? "Le profil et la devise doivent être actifs pour réactiver ce compte."
          : "Désactivez d’abord les cartes et opérations récurrentes liées à ce compte.",
      );
    }

    if (response.status === 404) {
      throw new Error("Ce compte n’est plus disponible.");
    }

    throw new Error(
      "La modification n’a pas pu être confirmée. Actualisez la liste.",
    );
  }

  const data: {
    item: { id: string; isActive: boolean };
  } = await response.json();

  return data.item;
}