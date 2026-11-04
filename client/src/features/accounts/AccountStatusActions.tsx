import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  changeAccountStatus,
  type Account,
} from "./accounts-api";

interface Props {
  account: Account;
  onChanged: (isActive: boolean) => void;
}

export function AccountStatusActions({
  account,
  onChanged,
}: Props) {
  const confirmationId = useId();
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const submissionLock = useRef(false);

  async function confirmChange() {
    if (submissionLock.current) return;

    submissionLock.current = true;
    setSubmitting(true);
    setError("");

    try {
      const updated = await changeAccountStatus(
        account.id,
        !account.isActive,
      );

      setConfirming(false);
      onChanged(updated.isActive);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Impossible de modifier le statut du compte.",
      );
    } finally {
      submissionLock.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-4">
      {!confirming ? (
        <Button
          type="button"
          variant="outline"
          aria-label={`${
            account.isActive ? "Désactiver" : "Réactiver"
          } le compte ${account.name}`}
          onClick={() => {
            setError("");
            setConfirming(true);
          }}
        >
          {account.isActive ? "Désactiver" : "Réactiver"}
        </Button>
      ) : (
        <div
          role="group"
          aria-labelledby={confirmationId}
          aria-busy={submitting}
          className="space-y-3 rounded-xl bg-muted/50 p-4"
        >
          <p id={confirmationId} className="text-sm font-medium">
            {account.isActive
              ? `Désactiver le compte « ${account.name} » ?`
              : `Réactiver le compte « ${account.name} » ?`}
          </p>

          <p className="text-sm text-muted-foreground">
            {account.isActive
              ? "Le solde et l’historique seront conservés. Vous pourrez réactiver ce compte."
              : "Le compte retrouvera le statut actif."}
          </p>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={account.isActive ? "destructive" : "default"}
              disabled={submitting}
              onClick={() => void confirmChange()}
            >
              {submitting ? "Enregistrement…" : "Confirmer"}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => {
                setConfirming(false);
                setError("");
              }}
            >
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}