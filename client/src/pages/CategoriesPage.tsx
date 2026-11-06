import { useEffect, useState } from "react";
import { Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateCategoryForm } from "@/features/categories/CreateCategoryForm";
import {
  fetchCategories,
  type CategoriesResponse,
  type CategoryFilter,
} from "@/features/categories/categories-api";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: CategoriesResponse };

const filters: Array<{ value: CategoryFilter; label: string }> = [
  { value: "ALL", label: "Toutes" },
  { value: "EXPENSE", label: "Dépenses" },
  { value: "INCOME", label: "Revenus" },
];

export function CategoriesPage() {
  const [filter, setFilter] = useState<CategoryFilter>("ALL");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState("");
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    async function load() {
      try {
        const data = await fetchCategories(page, filter, controller.signal);
        if (!controller.signal.aborted) setState({ status: "success", data });
      } catch (cause) {
        if (!controller.signal.aborted) {
          setState({ status: "error", message: cause instanceof Error ? cause.message : "Impossible de charger les catégories." });
        }
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
    <section aria-labelledby="categories-title" className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Votre espace financier</p>
          <h1 id="categories-title" className="mt-1 text-3xl font-semibold tracking-tight">Catégories</h1>
          <p className="mt-2 text-muted-foreground">Organisez vos revenus et vos dépenses.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={reload} disabled={state.status === "loading"}>Actualiser</Button>
          <Button type="button" disabled={showForm} aria-expanded={showForm} aria-controls={showForm ? "create-category-panel" : undefined} onClick={() => { setSuccess(""); setShowForm(true); }}>Nouvelle catégorie</Button>
        </div>
      </header>

      {success && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">{success}</p>}

      {showForm && (
        <CreateCategoryForm
          initialType={filter === "INCOME" ? "INCOME" : "EXPENSE"}
          onCancel={() => setShowForm(false)}
          onCreated={(category) => {
            setShowForm(false);
            setSuccess(`La catégorie « ${category.name} » a été créée.`);
            setFilter(category.type);
            setPage(1);
            reload();
          }}
        />
      )}

      <div role="group" aria-label="Filtrer les catégories par type" className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <Button key={item.value} type="button" variant={filter === item.value ? "default" : "outline"} aria-pressed={filter === item.value} onClick={() => {
            if (filter === item.value) return;
            setState({ status: "loading" });
            setFilter(item.value);
            setPage(1);
          }}>{item.label}</Button>
        ))}
      </div>

      {state.status === "loading" && <p role="status" className="rounded-2xl border bg-card p-8 text-muted-foreground">Chargement des catégories…</p>}

      {state.status === "error" && (
        <div className="rounded-2xl border border-destructive/40 bg-card p-6">
          <p role="alert" className="text-destructive">{state.message}</p>
          <Button type="button" variant="outline" onClick={reload} className="mt-4">Réessayer</Button>
        </div>
      )}

      {state.status === "success" && (
        <>
          <p role="status" className="text-sm text-muted-foreground">{state.data.pagination.total} catégorie(s) pour ce filtre</p>
          {state.data.items.length === 0 ? (
            <div className="rounded-2xl border bg-card p-8">
              <h2 className="text-lg font-semibold">Aucune catégorie sur cette page</h2>
              <p className="mt-2 text-muted-foreground">Choisissez un autre filtre ou créez une catégorie avec le bouton en haut de la page.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {state.data.items.map((category) => (
                <article key={category.id} className="rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Tags aria-hidden="true" className="size-5" /></div>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{category.isActive ? "Active" : "Inactive"}</span>
                  </div>
                  <h2 className="mt-4 break-words text-lg font-semibold">{category.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{category.type === "INCOME" ? "Revenus" : "Dépenses"}</p>
                </article>
              ))}
            </div>
          )}
          <nav aria-label="Pagination des catégories" className="flex flex-wrap items-center justify-between gap-4">
            <Button type="button" variant="outline" disabled={page <= 1} onClick={() => changePage(page - 1)}>Précédent</Button>
            <span className="text-sm text-muted-foreground">Page {page} sur {Math.max(1, state.data.pagination.totalPages)}</span>
            <Button type="button" variant="outline" disabled={page >= state.data.pagination.totalPages} onClick={() => changePage(page + 1)}>Suivant</Button>
          </nav>
        </>
      )}
    </section>
  );
}
