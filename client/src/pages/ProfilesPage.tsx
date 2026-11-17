import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateProfileForm } from "@/features/profiles/CreateProfileForm";
import { fetchProfiles, type ProfileFilter, type ProfilesResponse } from "@/features/profiles/profiles-api";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: ProfilesResponse };

const filters: Array<{ value: ProfileFilter; label: string }> = [
  { value: "ALL", label: "Tous" },
  { value: "ACTIVE", label: "Actifs" },
  { value: "INACTIVE", label: "Inactifs" },
];

export function ProfilesPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<ProfileFilter>("ALL");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState("");
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    async function load() {
      try {
        const data = await fetchProfiles(page, filter, controller.signal);
        if (!controller.signal.aborted) setState({ status: "success", data });
      } catch (cause) {
        if (!controller.signal.aborted) setState({ status: "error", message: cause instanceof Error ? cause.message : "Impossible de charger les profils." });
      }
    }
    void load();
    return () => controller.abort();
  }, [page, filter, refreshKey]);

  function reload() {
    setState({ status: "loading" });
    setRefreshKey((value) => value + 1);
  }

  function changePage(value: number) {
    setState({ status: "loading" });
    setPage(value);
  }

  return (
    <section aria-labelledby="profiles-title" className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Votre espace financier</p>
          <h1 id="profiles-title" className="mt-1 text-3xl font-semibold tracking-tight">Profils financiers</h1>
          <p className="mt-2 text-muted-foreground">Organisez vos comptes, vos transactions et vos budgets par profil.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" disabled={state.status === "loading"} onClick={reload}>Actualiser</Button>
          <Button type="button" disabled={showForm} aria-expanded={showForm} aria-controls={showForm ? "create-profile-panel" : undefined} onClick={() => { setSuccess(""); setShowForm(true); }}>Nouveau profil</Button>
        </div>
      </header>
      {success && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">{success}</p>}
      {showForm && <CreateProfileForm onCancel={() => setShowForm(false)} onCreated={(profile) => {
        setShowForm(false);
        setSuccess(`Le profil « ${profile.name} » a été créé.`);
        setFilter("ACTIVE");
        setPage(1);
        reload();
      }} />}
      <div role="group" aria-label="Filtrer les profils par statut" className="flex flex-wrap gap-2">
        {filters.map((item) => <Button key={item.value} type="button" variant={filter === item.value ? "default" : "outline"} aria-pressed={filter === item.value} onClick={() => {
          if (filter === item.value) return;
          setState({ status: "loading" });
          setFilter(item.value);
          setPage(1);
        }}>{item.label}</Button>)}
      </div>
      {state.status === "loading" && <p role="status" className="rounded-2xl border bg-card p-8 text-muted-foreground">Chargement des profils…</p>}
      {state.status === "error" && <div className="rounded-2xl border border-destructive/40 bg-card p-6">
        <p role="alert" className="text-destructive">{state.message}</p>
        <Button type="button" variant="outline" onClick={reload} className="mt-4">Réessayer</Button>
      </div>}
      {state.status === "success" && <>
        <p role="status" className="text-sm text-muted-foreground">{state.data.pagination.total} profil(s) pour ce filtre</p>
        {state.data.items.length === 0 ? <div className="rounded-2xl border bg-card p-8">
          <h2 className="text-lg font-semibold">Aucun profil sur cette page</h2>
          <p className="mt-2 text-muted-foreground">Choisissez un autre filtre ou créez un nouveau profil.</p>
        </div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {state.data.items.map((profile) => <article key={profile.id} className="rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Users aria-hidden="true" className="size-5" /></div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{profile.isActive ? "Actif" : "Inactif"}</span>
            </div>
            <h2 className="mt-4 break-words text-lg font-semibold">{profile.name}</h2>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">{profile.description ?? "Aucune description"}</p>
          </article>)}
        </div>}
        <nav aria-label="Pagination des profils" className="flex flex-wrap items-center justify-between gap-4">
          <Button type="button" variant="outline" disabled={page <= 1} onClick={() => changePage(page - 1)}>Précédent</Button>
          <span className="text-sm text-muted-foreground">Page {page} sur {Math.max(1, state.data.pagination.totalPages)}</span>
          <Button type="button" variant="outline" disabled={page >= state.data.pagination.totalPages} onClick={() => changePage(page + 1)}>Suivant</Button>
        </nav>
      </>}
    </section>
  );
}
