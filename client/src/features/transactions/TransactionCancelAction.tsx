import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format-money";
import { cancelTransaction, type Transaction } from "./transactions-api";

interface Props {
  transaction: Transaction;
  onCancelled: () => void;
}

export function TransactionCancelAction({ transaction, onCancelled }: Props) {
  const titleId = useId();
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);

  if (transaction.status !== "POSTED" || transaction.type === "ADJUSTMENT") {
    return null;
  }

  async function confirmCancellation() {
    if (lock.current) return;
    lock.current = true;
    setSubmitting(true);
    setError("");
    try {
      const result = await cancelTransaction(transaction.id);
      if (result.status !== "CANCELLED") {
        throw new Error("L’annulation n’a pas été confirmée. Actualisez la liste.");
      }
      setConfirming(false);
      onCancelled();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible d’annuler la transaction.");
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
          aria-label={`Annuler la transaction ${transaction.description}`}
          onClick={() => { setError(""); setConfirming(true); }}
        >
          Annuler la transaction
        </Button>
      ) : (
        <div role="group" aria-labelledby={titleId} aria-busy={submitting} className="space-y-3 rounded-xl bg-muted/50 p-4">
          <h3 id={titleId} className="font-semibold">Annuler « {transaction.description} » ?</h3>
          <p className="text-sm text-muted-foreground">
            Cette opération restera dans l’historique. Le solde du compte « {transaction.account.name} » {transaction.type === "EXPENSE" ? "augmentera" : "diminuera"} de {formatMoney(transaction.amountMinor, transaction.minorUnit, transaction.currencyCode)}.
          </p>
          <p className="text-sm text-muted-foreground">Cette action corrige votre suivi financier. Elle n’effectue aucun remboursement bancaire.</p>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="destructive" disabled={submitting} onClick={() => void confirmCancellation()}>
              {submitting ? "Annulation en cours…" : "Confirmer l’annulation"}
            </Button>
            <Button type="button" variant="outline" disabled={submitting} onClick={() => { setConfirming(false); setError(""); }}>Conserver la transaction</Button>
          </div>
        </div>
      )}
    </div>
  );
}
