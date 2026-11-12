import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateCardForm } from "@/features/cards/CreateCardForm";
import { CardStatusControl } from "@/features/cards/CardStatusControl";
import { EditCardForm } from "@/features/cards/EditCardForm";
import { fetchCards, type CardFilter, type CardsResponse, type PaymentCard } from "@/features/cards/cards-api";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: CardsResponse };

const filters: Array<{ value: CardFilter; label: string }> = [
  { value: "ALL", label: "Toutes" },
  { value: "ACTIVE", label: "Actives" },
  { value: "INACTIVE", label: "Inactives" },
];
const brands: Record<PaymentCard["brand"], string> = {
  VISA: "Visa", MASTERCARD: "Mastercard", AMEX: "American Express", OTHER: "Autre réseau",
};
const types: Record<PaymentCard["type"], string> = {
  CREDIT: "Crédit", DEBIT: "Débit", PREPAID: "Prépayée", OTHER: "Autre type",
};

function CardDetails({ card, onUpdated }: { card: PaymentCard; onUpdated: (card: PaymentCard, action: "edit" | "status") => void }) {
  const [editing, setEditing] = useState(false);
  const [confirmingStatus, setConfirmingStatus] = useState(false);
  const expiry = card.expiryMonth !== null && card.expiryYear !== null
    ? `${String(card.expiryMonth).padStart(2, "0")}/${card.expiryYear}`
    : "Non renseignée";

  return (
    <article className="overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm">
      <div className="bg-gradient-to-br from-blue-950 to-blue-700 p-6 text-white">
        <div className="flex items-start justify-between gap-3">
          <CreditCard aria-hidden="true" className="size-7 shrink-0" />
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">{card.isActive ? "Active" : "Inactive"}</span>
        </div>
        <h2 className="mt-5 break-words text-lg font-semibold">{card.nickname}</h2>
        <p aria-label={`Carte se terminant par ${card.last4}`} className="mt-5 font-mono text-xl tracking-widest">•••• {card.last4}</p>
        <p className="mt-4 text-sm text-blue-100">{brands[card.brand]} · {types[card.type]}</p>
      </div>
      <dl className="space-y-4 p-6 text-sm">
        <div><dt className="text-muted-foreground">Titulaire</dt><dd className="mt-1 break-words font-medium">{card.cardholderName}</dd></div>
        <div><dt className="text-muted-foreground">Expiration</dt><dd className="mt-1 font-medium">{expiry}</dd></div>
        <div><dt className="text-muted-foreground">Compte associé</dt><dd className="mt-1 break-words font-medium">{card.linkedAccount.name} ({card.linkedAccount.currencyCode}){!card.linkedAccount.isActive && " · Compte inactif"}</dd></div>
        <div><dt className="text-muted-foreground">Profil du compte</dt><dd className="mt-1 break-words font-medium">{card.linkedAccount.financialProfile.name}</dd></div>
      </dl>
      {editing ? (
        <EditCardForm card={card} onCancel={() => setEditing(false)} onUpdated={(updated) => {
          setEditing(false);
          onUpdated(updated, "edit");
        }} />
      ) : (
        <>
          <div className="px-6 pb-4">
            <Button type="button" variant="outline" disabled={confirmingStatus} onClick={() => setEditing(true)}>Modifier</Button>
          </div>
          <CardStatusControl card={card} onConfirmingChange={setConfirmingStatus} onUpdated={(updated) => onUpdated(updated, "status")} />
        </>
      )}
    </article>
  );
}

export function CardsPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<CardFilter>("ALL");
  const [refreshKey, setRefreshKey] = useState(0);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    async function load() {
      try {
        const data = await fetchCards(page, filter, controller.signal);
        if (!controller.signal.aborted) setState({ status: "success", data });
      } catch (cause) {
        if (!controller.signal.aborted) {
          setState({ status: "error", message: cause instanceof Error ? cause.message : "Impossible de charger les cartes." });
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
    <section aria-labelledby="cards-title" className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Votre espace financier</p>
          <h1 id="cards-title" className="mt-1 text-3xl font-semibold tracking-tight">Cartes</h1>
          <p className="mt-2 text-muted-foreground">Retrouvez vos cartes enregistrées et leurs comptes associés.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" disabled={state.status === "loading"} onClick={reload}>Actualiser</Button>
          <Button type="button" disabled={showForm} aria-expanded={showForm} aria-controls={showForm ? "create-card-panel" : undefined} onClick={() => { setSuccess(""); setShowForm(true); }}>Nouvelle carte</Button>
        </div>
      </header>
      {success && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">{success}</p>}
      {showForm && <CreateCardForm onCancel={() => setShowForm(false)} onCreated={(card) => {
        setShowForm(false);
        setSuccess(`La carte « ${card.nickname} » a été créée.`);
        setFilter("ACTIVE");
        setPage(1);
        reload();
      }} />}
      <p className="text-sm text-muted-foreground">Le statut indique si la carte est active dans cette application.</p>
      <div role="group" aria-label="Filtrer les cartes par statut" className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <Button key={item.value} type="button" variant={filter === item.value ? "default" : "outline"} aria-pressed={filter === item.value} onClick={() => {
            if (filter === item.value) return;
            setState({ status: "loading" });
            setFilter(item.value);
            setPage(1);
          }}>{item.label}</Button>
        ))}
      </div>
      {state.status === "loading" && <p role="status" className="rounded-2xl border bg-card p-8 text-muted-foreground">Chargement des cartes…</p>}
      {state.status === "error" && (
        <div className="rounded-2xl border border-destructive/40 bg-card p-6">
          <p role="alert" className="text-destructive">{state.message}</p>
          <Button type="button" variant="outline" className="mt-4" onClick={reload}>Réessayer</Button>
        </div>
      )}
      {state.status === "success" && (
        <>
          <p role="status" className="text-sm text-muted-foreground">{state.data.pagination.total} carte(s) pour ce filtre</p>
          {state.data.items.length === 0 ? (
            <div className="rounded-2xl border bg-card p-8">
              <h2 className="text-lg font-semibold">Aucune carte sur cette page</h2>
              <p className="mt-2 text-muted-foreground">Choisissez un autre filtre ou revenez à la page précédente.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {state.data.items.map((card) => <CardDetails key={card.id} card={card} onUpdated={(updated, action) => {
                setSuccess(action === "edit"
                  ? `Les informations de la carte « ${updated.nickname} » ont été modifiées.`
                  : `La carte « ${updated.nickname} » a été ${updated.isActive ? "réactivée" : "désactivée"}.`);
                setPage(1);
                reload();
              }} />)}
            </div>
          )}
          <nav aria-label="Pagination des cartes" className="flex flex-wrap items-center justify-between gap-4">
            <Button type="button" variant="outline" disabled={page <= 1} onClick={() => changePage(page - 1)}>Précédent</Button>
            <span className="text-sm text-muted-foreground">Page {page} sur {Math.max(1, state.data.pagination.totalPages)}</span>
            <Button type="button" variant="outline" disabled={page >= state.data.pagination.totalPages} onClick={() => changePage(page + 1)}>Suivant</Button>
          </nav>
        </>
      )}
    </section>
  );
}
