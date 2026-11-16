import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { TransactionStatusFilter } from "./transactions-api";

interface Props {
  month: string;
  status: TransactionStatusFilter;
  onApply: (month: string, status: TransactionStatusFilter) => void;
}

const fieldClass = "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function TransactionPeriodFilters({ month, status, onApply }: Props) {
  const helpId = useId();
  const [draftMonth, setDraftMonth] = useState(month);
  const [draftStatus, setDraftStatus] = useState(status);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draftMonth && !/^20\d{2}-(0[1-9]|1[0-2])$/.test(draftMonth)) {
      setError("Choisissez un mois entre janvier 2000 et décembre 2099.");
      return;
    }
    setError("");
    onApply(draftMonth, draftStatus);
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Filtres par mois et statut" className="space-y-3 rounded-2xl border bg-card p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">Mois (facultatif, UTC)
          <input type="month" min="2000-01" max="2099-12" value={draftMonth} onChange={(event) => setDraftMonth(event.target.value)} aria-describedby={helpId} className={fieldClass} />
        </label>
        <label className="text-sm font-medium">Statut
          <select value={draftStatus} onChange={(event) => setDraftStatus(event.target.value as TransactionStatusFilter)} className={fieldClass}>
            <option value="ALL">Tous les statuts</option>
            <option value="POSTED">Comptabilisées</option>
            <option value="PENDING">En attente</option>
            <option value="CANCELLED">Annulées</option>
          </select>
        </label>
      </div>
      <p id={helpId} className="text-sm text-muted-foreground">Le mois porte sur la date de transaction en UTC. Laissez le mois vide pour consulter toutes les dates.</p>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit">Appliquer</Button>
        <Button type="button" variant="outline" disabled={!month && status === "ALL" && !draftMonth && draftStatus === "ALL"} onClick={() => {
          setDraftMonth("");
          setDraftStatus("ALL");
          setError("");
          onApply("", "ALL");
        }}>Toutes les dates et tous les statuts</Button>
      </div>
    </form>
  );
}
