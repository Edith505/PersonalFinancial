export type CategoryType = "INCOME" | "EXPENSE";
export type CategoryFilter = "ALL" | CategoryType;

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  isActive: boolean;
}

export interface CategoriesResponse {
  items: Category[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export async function fetchCategories(
  page: number,
  filter: CategoryFilter,
  signal: AbortSignal,
): Promise<CategoriesResponse> {
  const query = new URLSearchParams({ page: String(page), pageSize: "12" });
  if (filter !== "ALL") query.set("type", filter);

  const response = await fetch(`/api/categories?${query}`, {
    signal,
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("Impossible de charger les catégories. Vérifiez que le serveur est démarré.");
  }

  return response.json();
}

export async function createCategory(input: {
  name: string;
  type: CategoryType;
}): Promise<Category> {
  let response: Response;
  try {
    response = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new Error("Connexion interrompue. Actualisez la liste avant de réessayer : la catégorie a peut-être été créée.");
  }

  if (response.status === 409) {
    throw new Error("Une catégorie de ce type porte déjà ce nom. Choisissez un autre nom ou utilisez la catégorie existante.");
  }
  if (response.status === 400) {
    throw new Error("Vérifiez le nom et le type de la catégorie.");
  }
  if (!response.ok) {
    throw new Error("La création n’a pas pu être confirmée. Actualisez la liste avant de réessayer.");
  }

  try {
    const data: { item: Category } = await response.json();
    return data.item;
  } catch {
    throw new Error("Réponse illisible. Actualisez la liste pour vérifier si la catégorie a été créée.");
  }
}
