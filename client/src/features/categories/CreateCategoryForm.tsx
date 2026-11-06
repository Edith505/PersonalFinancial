import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { createCategory, type Category, type CategoryType } from "./categories-api";

interface Props {
  initialType: CategoryType;
  onCreated: (category: Category) => void;
  onCancel: () => void;
}

const fieldClass =
  "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function CreateCategoryForm({ initialType, onCreated, onCancel }: Props) {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const lock = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    setError("");

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim().normalize("NFC");
    const type = form.get("type");

    if (!name || name.length > 100) {
      setError("Saisissez un nom de 1 à 100 caractères.");
      return;
    }
    if (type !== "INCOME" && type !== "EXPENSE") {
      setError("Choisissez Revenus ou Dépenses.");
      return;
    }

    lock.current = true;
    setSubmitting(true);
    try {
      const category = await createCategory({ name, type });
      onCreated(category);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible de créer la catégorie.");
    } finally {
      lock.current = false;
      setSubmitting(false);
    }
  }

  return (
    <section id="create-category-panel" aria-labelledby="create-category-title" className="rounded-2xl border bg-card p-6 text-card-foreground">
      <h2 id="create-category-title" className="text-xl font-semibold">Nouvelle catégorie</h2>
      <p className="mt-2 text-sm text-muted-foreground">Choisissez un nom pour classer vos revenus ou vos dépenses.</p>
      <form onSubmit={handleSubmit} className="mt-5" aria-busy={submitting}>
        <fieldset disabled={submitting} className="space-y-4">
          <legend className="sr-only">Informations de la catégorie</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Nom
              <input name="name" required maxLength={100} placeholder="Ex. Alimentation" className={fieldClass} />
            </label>
            <label className="text-sm font-medium">
              Type
              <select name="type" defaultValue={initialType} className={fieldClass}>
                <option value="EXPENSE">Dépenses</option>
                <option value="INCOME">Revenus</option>
              </select>
            </label>
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={submitting}>{submitting ? "Création en cours…" : "Créer la catégorie"}</Button>
            <Button type="button" variant="outline" disabled={submitting} onClick={onCancel}>Annuler</Button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
