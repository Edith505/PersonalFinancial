import { useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format-money";
import { copyBudgetPeriod, type Budget } from "./budgets-api";

interface Props { budget: Budget; onCopied: (budget: Budget) => void; onCancel: () => void; }

function nextMonth(month: string) {
  const value = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 1)).toISOString().slice(0, 7);
  return value <= "2099-12" ? value : "";
}

export function CopyBudgetPeriodForm({ budget, onCopied, onCancel }: Props) {
  const titleId = useId();
  const [month, setMonth] = useState(() => nextMonth(budget.period.month));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const lock = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    setError("");
    if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month)) { setError("Choisissez un mois entre janvier 2000 et décembre 2099."); return; }
    if (month === budget.period.month) { setError("Choisissez un autre mois que la période source."); return; }
    lock.current = true;
    setSubmitting(true);
    try { onCopied(await copyBudgetPeriod(budget.id, budget.periodId, month)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Impossible de reconduire le budget."); }
    finally { lock.current = false; setSubmitting(false); }
  }

  return <section aria-labelledby={titleId} className="rounded-xl border bg-muted/30 p-4">
    <h3 id={titleId} className="font-semibold">Reconduire ce budget</h3>
    <p className="mt-2 text-sm text-muted-foreground">Copier les {budget.items.length} catégorie(s) et leurs plafonds, soit {formatMoney(budget.totals.plannedMinor, budget.minorUnit, budget.currencyCode)}. Le profil et la devise restent identiques.</p>
    <p className="mt-2 text-sm text-muted-foreground">Les dépenses ne sont pas copiées. Celles déjà enregistrées pour le mois choisi seront prises en compte.</p>
    <form onSubmit={handleSubmit} className="mt-4" aria-busy={submitting}>
      <fieldset disabled={submitting} className="space-y-4">
        <legend className="sr-only">Mois de destination</legend>
        <label className="block text-sm font-medium">Mois à créer
          <input type="month" required min="2000-01" max="2099-12" value={month} onChange={(event) => { setMonth(event.target.value); setError(""); }} className="mt-1 block rounded-lg border border-input bg-background px-3 py-2 text-foreground" />
        </label>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={submitting}>{submitting ? "Reconduction en cours…" : "Créer cette période"}</Button>
          <Button type="button" variant="outline" disabled={submitting} onClick={onCancel}>Annuler</Button>
        </div>
      </fieldset>
    </form>
  </section>;
}
