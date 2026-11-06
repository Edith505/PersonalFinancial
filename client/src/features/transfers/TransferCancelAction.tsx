import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format-money";
import { cancelTransfer, type Transfer } from "./transfers-api";

interface Props {
  transfer: Transfer;
  onCancelled: () => void;
}

export function TransferCancelAction({ transfer, onCancelled }: Props) {
  const titleId = useId();
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);

  if (transfer.status !== "POSTED") return null;

  async function confirmCancellation() {
    if (lock.current) return;
    lock.current = true;
    setSubmitting(true);
    setError("");
    try {
      const result = await cancelTransfer(transfer.id);
      if (result.status !== "CANCELLED") {
        throw new Error("L’annulation n’a pas été confirmée. Actualisez la liste.");
      }
      setConfirming(false);
      onCancelled();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible d’annuler le virement.");
    } finally {
      lock.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-4 border-t pt-4">
      {!confirming ? (
        <Button
          type="button"
          variant="outline"
          aria-label={`Annuler le virement de ${transfer.sourceAccount.name} vers ${transfer.destinationAccount.name}`}
          onClick={() => { setError(""); setConfirming(true); }}
        >
          Annuler le virement
        </Button>
      ) : (
        <div role="group" aria-labelledby={titleId} aria-busy={submitting} className="space-y-3 rounded-xl bg-muted/50 p-4">
          <h3 id={titleId} className="font-semibold">Annuler ce virement ?</h3>
          <p className="text-sm">Le virement restera visible dans votre historique.</p>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>Le solde de « {transfer.sourceAccount.name} » augmentera de {formatMoney(transfer.sourceAmountMinor, transfer.sourceMinorUnit, transfer.sourceCurrencyCode)}.</li>
            <li>Le solde de « {transfer.destinationAccount.name} » diminuera de {formatMoney(transfer.destinationAmountMinor, transfer.destinationMinorUnit, transfer.destinationCurrencyCode)}.</li>
          </ul>
          <p className="text-sm text-muted-foreground">Cette action corrige votre suivi financier. Elle n’annule pas un transfert auprès de votre banque.</p>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="destructive" disabled={submitting} onClick={() => void confirmCancellation()}>
              {submitting ? "Annulation en cours…" : "Confirmer l’annulation"}
            </Button>
            <Button type="button" variant="outline" disabled={submitting} onClick={() => { setConfirming(false); setError(""); }}>Conserver le virement</Button>
          </div>
        </div>
      )}
    </div>
  );
}
