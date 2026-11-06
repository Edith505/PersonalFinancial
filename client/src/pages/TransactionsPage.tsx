import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format-money";
import { CreateTransactionForm } from "@/features/transactions/CreateTransactionForm";
import { TransactionCancelAction } from "@/features/transactions/TransactionCancelAction";
import { fetchTransactions, type TransactionFilter, type TransactionsResponse } from "@/features/transactions/transactions-api";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: TransactionsResponse };

const filters: Array<{ value: TransactionFilter; label: string }> = [
  { value: "ALL", label: "Toutes" },
  { value: "EXPENSE", label: "Dépenses" },
  { value: "INCOME", label: "Revenus" },
];
const typeLabels = { INCOME: "Revenu", EXPENSE: "Dépense", ADJUSTMENT: "Ajustement" };
const statusLabels = { POSTED: "Comptabilisée", PENDING: "En attente", CANCELLED: "Annulée" };
const dateFormatter = new Intl.DateTimeFormat("fr-CA", { dateStyle: "medium", timeStyle: "short" });

export function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<TransactionFilter>("ALL");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState("");
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    async function load() {
      try {
        const data = await fetchTransactions(page, filter, controller.signal);
        if (!controller.signal.aborted) setState({ status: "success", data });
      } catch (cause) {
        if (!controller.signal.aborted) setState({ status: "error", message: cause instanceof Error ? cause.message : "Impossible de charger les transactions." });
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
    <section aria-labelledby="transactions-title" className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Votre espace financier</p>
          <h1 id="transactions-title" className="mt-1 text-3xl font-semibold tracking-tight">Transactions</h1>
          <p className="mt-2 text-muted-foreground">Retrouvez vos revenus et vos dépenses, du plus récent au plus ancien.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={reload} disabled={state.status === "loading"}>Actualiser</Button>
          <Button type="button" disabled={showForm} aria-expanded={showForm} aria-controls={showForm ? "create-transaction-panel" : undefined} onClick={() => { setSuccess(""); setShowForm(true); }}>Nouvelle transaction</Button>
        </div>
      </header>
      {success && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">{success}</p>}
      {showForm && <CreateTransactionForm initialType={filter === "INCOME" ? "INCOME" : "EXPENSE"} onCancel={() => setShowForm(false)} onCreated={(transaction) => {
        setShowForm(false);
        setSuccess(`La transaction « ${transaction.description} » a été comptabilisée sur le compte « ${transaction.account.name} ».`);
        setFilter(transaction.type === "ADJUSTMENT" ? "ALL" : transaction.type);
        setPage(1);
        reload();
      }} />}
      <div role="group" aria-label="Filtrer les transactions par type" className="flex flex-wrap gap-2">
        {filters.map((item) => <Button key={item.value} type="button" variant={filter === item.value ? "default" : "outline"} aria-pressed={filter === item.value} onClick={() => {
          if (filter === item.value) return;
          setState({ status: "loading" });
          setFilter(item.value);
          setPage(1);
        }}>{item.label}</Button>)}
      </div>
      {state.status === "loading" && <p role="status" className="rounded-2xl border bg-card p-8 text-muted-foreground">Chargement des transactions…</p>}
      {state.status === "error" && <div className="rounded-2xl border border-destructive/40 bg-card p-6">
        <p role="alert" className="text-destructive">{state.message}</p>
        <Button type="button" variant="outline" onClick={reload} className="mt-4">Réessayer</Button>
      </div>}
      {state.status === "success" && <>
        <p role="status" className="text-sm text-muted-foreground">{state.data.pagination.total} transaction(s) pour ce filtre</p>
        {state.data.items.length === 0 ? <div className="rounded-2xl border bg-card p-8">
          <h2 className="text-lg font-semibold">Aucune transaction sur cette page</h2>
          <p className="mt-2 text-muted-foreground">Choisissez un autre filtre ou enregistrez une première opération.</p>
        </div> : <ul className="space-y-3">
          {state.data.items.map((transaction) => {
            const signedAmount = transaction.type === "EXPENSE" ? -BigInt(transaction.amountMinor) : BigInt(transaction.amountMinor);
            return <li key={transaction.id} className="rounded-2xl border bg-card p-5 text-card-foreground shadow-sm">
              <article>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="break-words text-lg font-semibold">{transaction.description}</h2>
                    <time dateTime={transaction.transactionDate} className="mt-1 block text-sm text-muted-foreground">{dateFormatter.format(new Date(transaction.transactionDate))}</time>
                  </div>
                  <p className={`text-xl font-semibold tabular-nums ${transaction.status === "CANCELLED" ? "text-muted-foreground line-through" : signedAmount < 0n ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>
                    {formatMoney(signedAmount.toString(), transaction.minorUnit, transaction.currencyCode)}
                  </p>
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div><dt className="text-muted-foreground">Compte</dt><dd className="break-words">{transaction.account.name}</dd></div>
                  <div><dt className="text-muted-foreground">Profil concerné</dt><dd className="break-words">{transaction.financialProfile.name}</dd></div>
                  <div><dt className="text-muted-foreground">Catégorie</dt><dd className="break-words">{transaction.category?.name ?? "Sans catégorie"}</dd></div>
                  <div><dt className="text-muted-foreground">Type et statut</dt><dd>{typeLabels[transaction.type]} ({statusLabels[transaction.status]})</dd></div>
                </dl>
                {transaction.merchant && <p className="mt-3 break-words text-sm text-muted-foreground">Tiers : {transaction.merchant}</p>}
                {transaction.status === "CANCELLED" && <p className="mt-3 text-sm text-muted-foreground">Transaction annulée, exclue du solde du compte.</p>}
                <TransactionCancelAction transaction={transaction} onCancelled={() => {
                  setSuccess(`La transaction « ${transaction.description} » a été annulée. Elle reste dans votre historique.`);
                  reload();
                }} />
              </article>
            </li>;
          })}
        </ul>}
        <nav aria-label="Pagination des transactions" className="flex flex-wrap items-center justify-between gap-4">
          <Button type="button" variant="outline" disabled={page <= 1} onClick={() => changePage(page - 1)}>Précédent</Button>
          <span className="text-sm text-muted-foreground">Page {page} sur {Math.max(1, state.data.pagination.totalPages)}</span>
          <Button type="button" variant="outline" disabled={page >= state.data.pagination.totalPages} onClick={() => changePage(page + 1)}>Suivant</Button>
        </nav>
      </>}
    </section>
  );
}
