import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format-money";
import { CreateTransferForm } from "@/features/transfers/CreateTransferForm";
import { TransferCancelAction } from "@/features/transfers/TransferCancelAction";
import { fetchTransfers, type TransfersResponse } from "@/features/transfers/transfers-api";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: TransfersResponse };

const dateFormatter = new Intl.DateTimeFormat("fr-CA", { dateStyle: "medium", timeStyle: "short" });
const statusLabels = { POSTED: "Comptabilisé", PENDING: "En attente", CANCELLED: "Annulé" };

export function TransfersPage() {
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
        const data = await fetchTransfers(page, controller.signal);
        if (!controller.signal.aborted) setState({ status: "success", data });
      } catch (cause) {
        if (!controller.signal.aborted) setState({ status: "error", message: cause instanceof Error ? cause.message : "Impossible de charger les virements." });
      }
    }
    void load();
    return () => controller.abort();
  }, [page, refreshKey]);

  function reload() {
    setState({ status: "loading" });
    setRefreshKey((value) => value + 1);
  }
  function changePage(value: number) {
    setState({ status: "loading" });
    setPage(value);
  }

  return (
    <section aria-labelledby="transfers-title" className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Votre espace financier</p>
          <h1 id="transfers-title" className="mt-1 text-3xl font-semibold tracking-tight">Virements</h1>
          <p className="mt-2 text-muted-foreground">Suivez les mouvements entre vos comptes.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={reload} disabled={state.status === "loading"}>Actualiser</Button>
          <Button type="button" disabled={showForm} aria-expanded={showForm} aria-controls={showForm ? "create-transfer-panel" : undefined} onClick={() => { setSuccess(""); setShowForm(true); }}>Nouveau virement</Button>
        </div>
      </header>
      {success && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">{success}</p>}
      {showForm && <CreateTransferForm onCancel={() => setShowForm(false)} onCreated={(transfer) => {
        setShowForm(false);
        setSuccess(`Le virement de « ${transfer.sourceAccount.name} » vers « ${transfer.destinationAccount.name} » a été enregistré.`);
        setPage(1);
        reload();
      }} />}
      {state.status === "loading" && <p role="status" className="rounded-2xl border bg-card p-8 text-muted-foreground">Chargement des virements…</p>}
      {state.status === "error" && <div className="rounded-2xl border border-destructive/40 bg-card p-6">
        <p role="alert" className="text-destructive">{state.message}</p>
        <Button type="button" variant="outline" onClick={reload} className="mt-4">Réessayer</Button>
      </div>}
      {state.status === "success" && <>
        <p role="status" className="text-sm text-muted-foreground">{state.data.pagination.total} virement(s) enregistré(s)</p>
        {state.data.items.length === 0 ? <div className="rounded-2xl border bg-card p-8">
          <h2 className="text-lg font-semibold">Aucun virement sur cette page</h2>
          <p className="mt-2 text-muted-foreground">Vos virements apparaîtront ici après leur enregistrement.</p>
        </div> : <ul className="space-y-3">
          {state.data.items.map((transfer) => <li key={transfer.id} className="rounded-2xl border bg-card p-5 text-card-foreground shadow-sm">
            <article>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="break-words text-lg font-semibold">{transfer.description ?? "Virement entre comptes"}</h2>
                  <time dateTime={transfer.transferDate} className="mt-1 block text-sm text-muted-foreground">{dateFormatter.format(new Date(transfer.transferDate))}</time>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{statusLabels[transfer.status]}</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <div className="min-w-0 rounded-xl bg-muted/40 p-4">
                  <p className="text-sm text-muted-foreground">Compte source</p>
                  <p className="break-words font-medium">{transfer.sourceAccount.name}</p>
                  <p className={`mt-2 break-words text-lg font-semibold tabular-nums ${transfer.status === "CANCELLED" ? "text-muted-foreground line-through" : ""}`}>-{formatMoney(transfer.sourceAmountMinor, transfer.sourceMinorUnit, transfer.sourceCurrencyCode)}</p>
                </div>
                <ArrowRight aria-hidden="true" className="hidden size-5 text-muted-foreground sm:block" />
                <div className="min-w-0 rounded-xl bg-muted/40 p-4">
                  <p className="text-sm text-muted-foreground">Compte destinataire</p>
                  <p className="break-words font-medium">{transfer.destinationAccount.name}</p>
                  <p className={`mt-2 break-words text-lg font-semibold tabular-nums ${transfer.status === "CANCELLED" ? "text-muted-foreground line-through" : ""}`}>+{formatMoney(transfer.destinationAmountMinor, transfer.destinationMinorUnit, transfer.destinationCurrencyCode)}</p>
                </div>
              </div>
              {transfer.status === "CANCELLED" && <p className="mt-3 text-sm text-muted-foreground">Virement annulé, exclu des soldes des deux comptes.</p>}
              <TransferCancelAction transfer={transfer} onCancelled={() => {
                setSuccess("Le virement a été annulé. Il reste dans votre historique et ne compte plus dans les soldes.");
                reload();
              }} />
            </article>
          </li>)}
        </ul>}
        <nav aria-label="Pagination des virements" className="flex flex-wrap items-center justify-between gap-4">
          <Button type="button" variant="outline" disabled={page <= 1} onClick={() => changePage(page - 1)}>Précédent</Button>
          <span className="text-sm text-muted-foreground">Page {page} sur {Math.max(1, state.data.pagination.totalPages)}</span>
          <Button type="button" variant="outline" disabled={page >= state.data.pagination.totalPages} onClick={() => changePage(page + 1)}>Suivant</Button>
        </nav>
      </>}
    </section>
  );
}
