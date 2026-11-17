export interface FinancialProfile {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export type ProfileFilter = "ALL" | "ACTIVE" | "INACTIVE";

export interface ProfilesResponse {
  items: FinancialProfile[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export async function fetchProfiles(page: number, filter: ProfileFilter, signal: AbortSignal): Promise<ProfilesResponse> {
  const query = new URLSearchParams({ page: String(page), pageSize: "12" });
  if (filter !== "ALL") query.set("status", filter);
  const response = await fetch(`/api/profiles?${query}`, {
    signal, cache: "no-store", headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Impossible de charger les profils. Vérifiez que le serveur est démarré.");
  return response.json();
}

export async function createProfile(input: { name: string; description?: string }): Promise<FinancialProfile> {
  let response: Response;
  try {
    response = await fetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new Error("Connexion interrompue. Actualisez la liste avant de réessayer : le profil a peut-être été créé.");
  }
  if (response.status === 400) throw new Error("Vérifiez le nom et la description du profil.");
  if (!response.ok) throw new Error("La création n’a pas pu être confirmée. Actualisez la liste avant de réessayer.");
  try {
    const result: { item: FinancialProfile } = await response.json();
    return result.item;
  } catch {
    throw new Error("Réponse illisible. Actualisez la liste pour vérifier si le profil a été créé.");
  }
}
