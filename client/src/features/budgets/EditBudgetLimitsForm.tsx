import { useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { parseMoney } from "@/lib/parse-money";
import { updateBudgetLimits, type Budget } from "./budgets-api";

interface Props { budget: Budget; onSaved: (budget: Budget) => void; onCancel: () => void; }

function editableAmount(value: string, minorUnit: number) {
  const amount = BigInt(value);
  const scale = 10n ** BigInt(minorUnit);
  return minorUnit === 0 ? amount.toString()
    : `${amount / scale},${(amount % scale).toString().padStart(minorUnit, "0")}`;
}

export function EditBudgetLimitsForm({ budget, onSaved, onCancel }: Props) {
  const titleId = useId();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const lock = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    setError("");
    const form = new FormData(event.currentTarget);
    lock.current = true;
    setSubmitting(true);
    try {
      const items = budget.items.map((item) => {
        let amountMinor: string;
        try { amountMinor = parseMoney(String(form.get(item.id) ?? ""), budget.minorUnit); }
        catch (cause) { throw new Error(`${item.category.name} : ${cause instanceof Error ? cause.message : "montant invalide"}`); }
        if (BigInt(amountMinor) < 0n) throw new Error(`${item.category.name} : le plafond ne peut pas être négatif.`);
        return { id: item.id, amountMinor, original: item.plannedMinor };
      }).filter((item) => item.amountMinor !== item.original)
        .map(({ id, amountMinor }) => ({ id, amountMinor }));
      if (items.length === 0) { onCancel(); return; }
      onSaved(await updateBudgetLimits(budget.id, budget.periodId, items));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible de modifier les plafonds.");
    } finally { lock.current = false; setSubmitting(false); }
  }

  return <section aria-labelledby={titleId} className="rounded-xl border bg-muted/30 p-4">
    <h3 id={titleId} className="font-semibold">Modifier les plafonds ({budget.currencyCode})</h3>
    <p className="mt-2 text-sm text-muted-foreground">La modification concerne uniquement ce mois. Un plafond inférieur aux dépenses déjà enregistrées fera apparaître un dépassement.</p>
    <form onSubmit={handleSubmit} className="mt-4" aria-busy={submitting}>
      <fieldset disabled={submitting} className="space-y-4">
        <legend className="sr-only">Plafonds par catégorie</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {budget.items.map((item) => <label key={item.id} className="text-sm font-medium">{item.category.name}
            <input name={item.id} type="text" inputMode="decimal" required maxLength={30} defaultValue={editableAmount(item.plannedMinor, budget.minorUnit)} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" />
          </label>)}
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={submitting}>{submitting ? "Enregistrement…" : "Enregistrer les plafonds"}</Button>
          <Button type="button" variant="outline" disabled={submitting} onClick={onCancel}>Annuler</Button>
        </div>
      </fieldset>
    </form>
  </section>;
}
