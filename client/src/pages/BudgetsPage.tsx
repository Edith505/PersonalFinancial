import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format-money";
import { CreateBudgetForm } from "@/features/budgets/CreateBudgetForm";
import { EditBudgetLimitsForm } from "@/features/budgets/EditBudgetLimitsForm";
import { CopyBudgetPeriodForm } from "@/features/budgets/CopyBudgetPeriodForm";
import { fetchBudgets, type Budget, type BudgetsResponse } from "@/features/budgets/budgets-api";

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "success"; data: BudgetsResponse };
const monthFormatter = new Intl.DateTimeFormat("fr-CA", { month: "long", year: "numeric", timeZone: "UTC" });

function BudgetCard({ budget, onUpdated, onCopied }: { budget: Budget; onUpdated: (budget: Budget) => void; onCopied: (budget: Budget) => void }) {
  const [editing, setEditing] = useState(false);
  const [copying, setCopying] = useState(false);
  const money = (value: string) => formatMoney(value, budget.minorUnit, budget.currencyCode);
  const remaining = BigInt(budget.totals.remainingMinor);
  return <article className="min-w-0 space-y-5 rounded-2xl border bg-card p-5 text-card-foreground shadow-sm">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="break-words text-xl font-semibold">{budget.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{budget.financialProfile?.name ?? "Tous les profils"} · {budget.currencyCode} · {monthFormatter.format(new Date(`${budget.period.startDate}T00:00:00Z`))} (UTC)</p>
      </div>
      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{budget.isActive ? "Actif" : "Inactif"}</span>
    </header>
    <dl className="grid gap-4 rounded-xl bg-muted/40 p-4 sm:grid-cols-3">
      <div><dt className="text-sm text-muted-foreground">Total prévu</dt><dd className="mt-1 break-words text-lg font-semibold tabular-nums">{money(budget.totals.plannedMinor)}</dd></div>
      <div><dt className="text-sm text-muted-foreground">Dépensé dans ces catégories</dt><dd className="mt-1 break-words text-lg font-semibold tabular-nums">{money(budget.totals.coveredSpentMinor)}</dd></div>
      <div><dt className="text-sm text-muted-foreground">{remaining < 0n ? "Dépassement global" : "Reste dans ces plafonds"}</dt><dd className={`mt-1 break-words text-lg font-semibold tabular-nums ${remaining < 0n ? "text-red-700 dark:text-red-400" : ""}`}>{money((remaining < 0n ? -remaining : remaining).toString())}</dd></div>
    </dl>
    <ul className="space-y-4">{budget.items.map((item) => {
      const planned = BigInt(item.plannedMinor);
      const spent = BigInt(item.spentMinor);
      const ratio = planned === 0n ? (spent > 0n ? 10000n : 0n) : spent * 10000n / planned;
      const percent = Number(ratio > 10000n ? 10000n : ratio) / 100;
      return <li key={item.id} className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="break-words text-sm font-semibold">{item.category.name}</h3>
          <p className="text-sm tabular-nums">{money(item.spentMinor)} sur {money(item.plannedMinor)}</p>
        </div>
        <progress max={100} value={percent} aria-label={`Plafond utilisé pour ${item.category.name}`} aria-valuetext={`${money(item.spentMinor)} dépensés pour un plafond de ${money(item.plannedMinor)}`} className={`block h-2 w-full ${item.isOverBudget ? "accent-red-600" : "accent-blue-600"}`} />
        <p className={`text-sm ${item.isOverBudget ? "text-red-700 dark:text-red-400" : "text-muted-foreground"}`}>{item.isOverBudget ? `Dépassement : ${money((-BigInt(item.remainingMinor)).toString())}` : `Reste : ${money(item.remainingMinor)}`}</p>
      </li>;
    })}</ul>
    <div className="space-y-2 border-t pt-4 text-sm">
      <p>Dépenses dans les catégories non prévues : <strong className="tabular-nums">{money(budget.totals.unbudgetedSpentMinor)}</strong>.</p>
      <p className="text-muted-foreground">Toutes les dépenses du mois pour ce profil et cette devise : {money(budget.totals.totalExpensesMinor)}.</p>
    </div>
    {editing ? <EditBudgetLimitsForm budget={budget} onCancel={() => setEditing(false)} onSaved={(updated) => { setEditing(false); onUpdated(updated); }} /> : copying ? (
      <CopyBudgetPeriodForm budget={budget} onCancel={() => setCopying(false)} onCopied={(created) => { setCopying(false); onCopied(created); }} />
    ) : (
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" disabled={!budget.isActive} aria-label={`Modifier les plafonds du budget ${budget.name}`} onClick={() => setEditing(true)}>Modifier les plafonds</Button>
        <Button type="button" variant="outline" disabled={!budget.isActive} aria-label={`Reconduire le budget ${budget.name}`} onClick={() => setCopying(true)}>Reconduire</Button>
      </div>
    )}
  </article>;
}

export function BudgetsPage() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
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
        const data = await fetchBudgets(month, page, controller.signal);
        if (!controller.signal.aborted) setState({ status: "success", data });
      } catch (cause) {
        if (!controller.signal.aborted) setState({ status: "error", message: cause instanceof Error ? cause.message : "Impossible de charger les budgets." });
      }
    }
    void load();
    return () => controller.abort();
  }, [month, page, refreshKey]);
  function reload() { setState({ status: "loading" }); setRefreshKey((value) => value + 1); }
  function changePage(value: number) { setState({ status: "loading" }); setPage(value); }

  return <section aria-labelledby="budgets-title" className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-sm font-medium text-muted-foreground">Votre espace financier</p><h1 id="budgets-title" className="mt-1 text-3xl font-semibold tracking-tight">Budgets</h1><p className="mt-2 text-muted-foreground">Suivez vos dépenses par catégorie, par mois et par devise.</p></div>
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={reload} disabled={state.status === "loading"}>Actualiser</Button>
        <Button type="button" disabled={showForm} aria-expanded={showForm} aria-controls={showForm ? "create-budget-panel" : undefined} onClick={() => { setSuccess(""); setShowForm(true); }}>Nouveau budget</Button>
      </div>
    </header>
    {success && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">{success}</p>}
    {showForm && <CreateBudgetForm initialMonth={month} onCancel={() => setShowForm(false)} onCreated={(budget) => {
      setShowForm(false); setMonth(budget.period.month); setPage(1);
      setSuccess(`Le budget « ${budget.name} » a été créé.`); reload();
    }} />}
    <label className="inline-block text-sm font-medium">Mois
      <input type="month" min="2000-01" max="2099-12" value={month} onChange={(event) => {
        const value = event.target.value;
        if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(value) || value === month) return;
        setState({ status: "loading" }); setMonth(value); setPage(1);
      }} className="ml-2 rounded-lg border border-input bg-background px-3 py-2 text-foreground" />
    </label>
    <p className="text-sm text-muted-foreground">Seules les dépenses comptabilisées sont incluses. Les virements et opérations annulées sont exclus. Les budgets peuvent couvrir les mêmes dépenses : leurs totaux ne doivent pas être additionnés entre eux.</p>
    {state.status === "loading" && <p role="status" className="rounded-2xl border bg-card p-8 text-muted-foreground">Chargement des budgets…</p>}
    {state.status === "error" && <div className="rounded-2xl border border-destructive/40 bg-card p-6"><p role="alert" className="text-destructive">{state.message}</p><Button type="button" variant="outline" onClick={reload} className="mt-4">Réessayer</Button></div>}
    {state.status === "success" && <>
      <p role="status" className="text-sm text-muted-foreground">{state.data.pagination.total} budget(s) pour ce mois. Périodes en UTC.</p>
      {state.data.items.length === 0 ? <div className="rounded-2xl border bg-card p-8"><h2 className="text-lg font-semibold">Aucun budget sur cette page</h2><p className="mt-2 text-muted-foreground">Choisissez un autre mois ou créez un budget.</p></div> : <div className="grid items-start gap-6 xl:grid-cols-2">{state.data.items.map((budget) => <BudgetCard key={budget.periodId} budget={budget} onUpdated={(updated) => { setSuccess(`Les plafonds du budget « ${updated.name} » ont été modifiés.`); reload(); }} onCopied={(created) => { setMonth(created.period.month); setPage(1); setSuccess(`Le budget « ${created.name} » a été reconduit pour ${created.period.month}.`); reload(); }} />)}</div>}
      <nav aria-label="Pagination des budgets" className="flex flex-wrap items-center justify-between gap-4">
        <Button type="button" variant="outline" disabled={page <= 1} onClick={() => changePage(page - 1)}>Précédent</Button>
        <span className="text-sm text-muted-foreground">Page {page} sur {Math.max(1, state.data.pagination.totalPages)}</span>
        <Button type="button" variant="outline" disabled={page >= state.data.pagination.totalPages} onClick={() => changePage(page + 1)}>Suivant</Button>
      </nav>
    </>}
  </section>;
}
