export type CardFilter = "ALL" | "ACTIVE" | "INACTIVE";

export interface PaymentCard {
  id: string;
  nickname: string;
  cardholderName: string;
  brand: "VISA" | "MASTERCARD" | "AMEX" | "OTHER";
  type: "CREDIT" | "DEBIT" | "PREPAID" | "OTHER";
  last4: string;
  expiryMonth: number | null;
  expiryYear: number | null;
  isActive: boolean;
  linkedAccount: {
    id: string;
    name: string;
    currencyCode: string;
    isActive: boolean;
    financialProfile: { id: string; name: string };
  };
}

export interface CardsResponse {
  items: PaymentCard[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface CardOptions {
  accounts: Array<{
    id: string;
    name: string;
    currencyCode: string;
    financialProfile: { id: string; name: string };
  }>;
}

export interface CreateCardInput {
  linkedAccountId: string;
  nickname: string;
  cardholderName: string;
  brand: PaymentCard["brand"];
  type: PaymentCard["type"];
  last4: string;
  expiryMonth: number | null;
  expiryYear: number | null;
}

export interface UpdateCardInput {
  nickname?: string;
  cardholderName?: string;
  expiryMonth?: number | null;
  expiryYear?: number | null;
}

export async function updateCard(cardId: string, input: UpdateCardInput): Promise<PaymentCard> {
  let response: Response;
  try {
    response = await fetch(`/api/cards/${encodeURIComponent(cardId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new Error("Connexion interrompue. Actualisez la liste pour vérifier les informations de la carte avant de réessayer.");
  }
  if (!response.ok) {
    const result: { error?: { code?: string } } = await response.json().catch(() => ({}));
    switch (result.error?.code) {
      case "INVALID_CARD_UPDATE": throw new Error("Vérifiez le nom, le titulaire et la paire mois/année d’expiration.");
      case "CARD_NOT_FOUND": throw new Error("Cette carte n’est plus disponible. Actualisez la liste.");
      default: throw new Error("La modification n’a pas pu être confirmée. Actualisez la liste avant de réessayer.");
    }
  }
  try {
    const result: { item: PaymentCard } = await response.json();
    return result.item;
  } catch {
    throw new Error("Réponse illisible. Actualisez la liste pour vérifier les informations de la carte.");
  }
}

export async function fetchCardOptions(signal: AbortSignal): Promise<CardOptions> {
  const response = await fetch("/api/cards/options", {
    signal, cache: "no-store", headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Impossible de charger les comptes disponibles.");
  return response.json();
}

export async function createCard(input: CreateCardInput): Promise<PaymentCard> {
  let response: Response;
  try {
    response = await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new Error("Connexion interrompue. Actualisez la liste avant de réessayer : la carte a peut-être été créée.");
  }
  if (!response.ok) {
    const result: { error?: { code?: string } } = await response.json().catch(() => ({}));
    switch (result.error?.code) {
      case "INVALID_CARD": throw new Error("Vérifiez les champs, les quatre chiffres et le mois et l’année d’expiration.");
      case "ACCOUNT_NOT_FOUND":
      case "CARD_ACCOUNT_UNAVAILABLE": throw new Error("Ce compte n’est plus disponible. Actualisez les comptes du formulaire et choisissez un compte actif.");
      default: throw new Error("La création n’a pas pu être confirmée. Actualisez la liste avant de réessayer.");
    }
  }
  try {
    const result: { item: PaymentCard } = await response.json();
    return result.item;
  } catch {
    throw new Error("Réponse illisible. Actualisez la liste pour vérifier si la carte a été créée.");
  }
}

export async function fetchCards(page: number, filter: CardFilter, signal: AbortSignal): Promise<CardsResponse> {
  const query = new URLSearchParams({ page: String(page), pageSize: "12" });
  if (filter !== "ALL") query.set("status", filter);
  const response = await fetch(`/api/cards?${query}`, {
    signal,
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error("Impossible de charger les cartes. Vérifiez que le serveur est démarré.");
  }
  return response.json();
}

export async function setCardStatus(cardId: string, isActive: boolean): Promise<PaymentCard> {
  let response: Response;
  try {
    response = await fetch(`/api/cards/${encodeURIComponent(cardId)}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ isActive }),
    });
  } catch {
    throw new Error("Connexion interrompue. Actualisez la liste pour vérifier le statut de la carte avant de réessayer.");
  }
  if (!response.ok) {
    const result: { error?: { code?: string } } = await response.json().catch(() => ({}));
    switch (result.error?.code) {
      case "INVALID_CARD_STATUS": throw new Error("Le statut demandé est invalide. Actualisez la page.");
      case "CARD_NOT_FOUND": throw new Error("Cette carte n’est plus disponible. Actualisez la liste.");
      case "CARD_DEACTIVATION_BLOCKED": throw new Error("Cette carte est utilisée par une opération planifiée active. Désactivez d’abord les opérations planifiées liées.");
      case "CARD_REACTIVATION_BLOCKED": throw new Error("Réactivez d’abord le compte associé, son profil et sa devise avant de réactiver la carte.");
      default: throw new Error("Le changement de statut n’a pas pu être confirmé. Actualisez la liste avant de réessayer.");
    }
  }
  try {
    const result: { item: PaymentCard } = await response.json();
    return result.item;
  } catch {
    throw new Error("Réponse illisible. Actualisez la liste pour vérifier le statut de la carte.");
  }
}
