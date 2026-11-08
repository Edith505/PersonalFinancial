import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { parseMoney } from "@/lib/parse-money";
import { createBudget, fetchBudgetOptions, type Budget, type BudgetOptions } from "./budgets-api";

interface Props { initialMonth: string; onCreated: (budget: Budget) => void; onCancel: () => void; }
const fieldClass = "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function CreateBudgetForm({ initialMonth, onCreated, onCancel }: Props) {
  const [options, setOptions] = useState<BudgetOptions | null>(null);
  const [currencyCode, setCurrencyCode] = useState("");
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const lock = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const data = await fetchBudgetOptions(controller.signal);
        if (controller.signal.aborted) return;
        setOptions(data);
        setCurrencyCode(data.currencies.find((item) => item.code === "CAD")?.code ?? data.currencies[0]?.code ?? "");
      } catch (cause) {
        if (!controller.signal.aborted) setLoadError(cause instanceof Error ? cause.message : "Impossible de charger le formulaire.");
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current || !options) return;
    setError("");
    const form = new FormData(event.currentTarget);
    const currency = options.currencies.find((item) => item.code === currencyCode);
    lock.current = true;
    setSubmitting(true);
    try {
      if (!currency) throw new Error("Choisissez une devise disponible.");
      const name = String(form.get("name") ?? "").trim();
      const month = String(form.get("month") ?? "");
      if (!name) throw new Error("Le nom du budget est obligatoire.");
      if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month)) throw new Error("Choisissez un mois entre janvier 2000 et décembre 2099.");
      const entries = Object.entries(amounts);
      if (entries.length === 0 || entries.length > 50) throw new Error("Choisissez de 1 à 50 catégories.");
      const items = entries.map(([categoryId, value]) => {
        const categoryName = options.categories.find((item) => item.id === categoryId)?.name ?? "Catégorie";
        let amountMinor: string;
        try { amountMinor = parseMoney(value, currency.minorUnit); }
        catch (cause) { throw new Error(`${categoryName} : ${cause instanceof Error ? cause.message : "montant invalide"}`); }
        if (BigInt(amountMinor) < 0n) throw new Error(`${categoryName} : le plafond ne peut pas être négatif.`);
        return { categoryId, amountMinor };
      });
      const budget = await createBudget({
        name, month, currencyCode,
        financialProfileId: String(form.get("profileId") ?? "") || null,
        items,
      });
      onCreated(budget);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible de créer le budget.");
    } finally { lock.current = false; setSubmitting(false); }
  }

  const unavailable = options && (options.currencies.length === 0 || options.categories.length === 0);
  return <section id="create-budget-panel" aria-labelledby="create-budget-title" className="rounded-2xl border bg-card p-6 text-card-foreground">
    <h2 id="create-budget-title" className="text-xl font-semibold">Nouveau budget mensuel</h2>
    <p className="mt-2 text-sm text-muted-foreground">Définissez un plafond pour chaque catégorie sélectionnée. Les dépenses déjà enregistrées pour ce mois seront prises en compte.</p>
    {!options ? <>
      {loadError ? <p role="alert" className="mt-4 text-destructive">{loadError} Fermez puis rouvrez le formulaire pour réessayer.</p> : <p role="status" className="mt-4 text-muted-foreground">Chargement du formulaire…</p>}
      <Button type="button" variant="outline" onClick={onCancel} className="mt-4">Fermer</Button>
    </> : unavailable ? <div className="mt-4 space-y-3">
      <p>Une devise active et au moins une catégorie de dépense sont nécessaires. Vous pouvez créer une catégorie dans la <Link to="/categories" className="underline">page Catégories</Link>.</p>
      <Button type="button" variant="outline" onClick={onCancel}>Fermer</Button>
    </div> : <form onSubmit={handleSubmit} className="mt-5" aria-busy={submitting}>
      <fieldset disabled={submitting} className="space-y-5">
        <legend className="sr-only">Informations et plafonds du budget</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">Nom<input name="name" required maxLength={100} placeholder="Ex. Dépenses du foyer" className={fieldClass} /></label>
          <label className="text-sm font-medium">Mois<input name="month" type="month" required min="2000-01" max="2099-12" defaultValue={initialMonth} className={fieldClass} /></label>
          <label className="text-sm font-medium">Devise<select value={currencyCode} onChange={(event) => setCurrencyCode(event.target.value)} className={fieldClass}>
            {options.currencies.map((item) => <option key={item.code} value={item.code}>{item.code} : {item.name}</option>)}
          </select></label>
          <label className="text-sm font-medium">Profil concerné<select name="profileId" defaultValue="" className={fieldClass}>
            <option value="">Tous les profils</option>
            {options.profiles.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select></label>
        </div>
        <p className="text-sm text-muted-foreground">Période du premier jour du mois au premier jour du mois suivant, en UTC. Le profil correspond à celui des transactions, pas nécessairement à celui du compte.</p>
        <fieldset className="space-y-3">
          <legend className="mb-3 text-sm font-semibold">Catégories et plafonds ({currencyCode})</legend>
          {options.categories.map((category) => {
            const selected = Object.prototype.hasOwnProperty.call(amounts, category.id);
            return <div key={category.id} className="grid items-center gap-3 rounded-xl border p-3 sm:grid-cols-2">
              <label className="flex items-center gap-3 text-sm font-medium">
                <input type="checkbox" checked={selected} disabled={!selected && Object.keys(amounts).length >= 50} onChange={(event) => {
                  const checked = event.target.checked;
                  setAmounts((current) => {
                    const next = { ...current };
                    if (checked) next[category.id] = "";
                    else delete next[category.id];
                    return next;
                  });
                }} />{category.name}
              </label>
              <label className="text-sm">Plafond ({currencyCode})
                <input type="text" inputMode="decimal" value={amounts[category.id] ?? ""} required={selected} disabled={!selected} maxLength={30} placeholder="Ex. 300,00" aria-label={`Plafond pour ${category.name} en ${currencyCode}`} onChange={(event) => setAmounts((current) => ({ ...current, [category.id]: event.target.value }))} className={fieldClass} />
              </label>
            </div>;
          })}
        </fieldset>
        <p className="text-sm text-muted-foreground">Un plafond de zéro est autorisé. Les dépenses des catégories non sélectionnées seront affichées séparément.</p>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={submitting || Object.keys(amounts).length === 0}>{submitting ? "Création en cours…" : "Créer le budget"}</Button>
          <Button type="button" variant="outline" disabled={submitting} onClick={onCancel}>Annuler</Button>
        </div>
      </fieldset>
    </form>}
  </section>;
}
