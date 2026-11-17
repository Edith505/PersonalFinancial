import { useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { createProfile, type FinancialProfile } from "./profiles-api";

interface Props {
  onCreated: (profile: FinancialProfile) => void;
  onCancel: () => void;
}
const fieldClass = "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function CreateProfileForm({ onCreated, onCancel }: Props) {
  const titleId = useId();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const lock = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    setError("");
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim().normalize("NFC");
    const description = String(form.get("description") ?? "").trim();
    if (!name || name.length > 100 || description.length > 1000) {
      setError("Saisissez un nom de 1 à 100 caractères et une description de 1000 caractères maximum.");
      return;
    }
    lock.current = true;
    setSubmitting(true);
    try {
      onCreated(await createProfile({ name, ...(description ? { description } : {}) }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible de créer le profil.");
    } finally {
      lock.current = false;
      setSubmitting(false);
    }
  }

  return (
    <section id="create-profile-panel" aria-labelledby={titleId} className="rounded-2xl border bg-card p-6 text-card-foreground">
      <h2 id={titleId} className="text-xl font-semibold">Nouveau profil financier</h2>
      <p className="mt-2 text-sm text-muted-foreground">Donnez un nom à la personne ou au périmètre financier que vous souhaitez suivre.</p>
      <form onSubmit={handleSubmit} aria-busy={submitting} className="mt-5">
        <fieldset disabled={submitting} className="space-y-4">
          <legend className="sr-only">Informations du profil</legend>
          <label className="block text-sm font-medium">Nom
            <input name="name" required maxLength={100} placeholder="Ex. Famille" className={fieldClass} />
          </label>
          <label className="block text-sm font-medium">Description (facultative)
            <textarea name="description" maxLength={1000} rows={3} className={fieldClass} />
          </label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={submitting}>{submitting ? "Création en cours…" : "Créer le profil"}</Button>
            <Button type="button" variant="outline" disabled={submitting} onClick={onCancel}>Annuler</Button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
