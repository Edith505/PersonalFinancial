import { useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { setCardStatus, type PaymentCard } from "./cards-api";

interface Props {
  card: PaymentCard;
  onUpdated: (card: PaymentCard) => void;
  onConfirmingChange?: (confirming: boolean) => void;
}

export function CardStatusControl({ card, onUpdated, onConfirmingChange }: Props) {
  const titleId = useId();
  const panelId = useId();
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const action = card.isActive ? "Désactiver" : "Réactiver";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setSubmitting(true);
    setError("");
    try {
      const updated = await setCardStatus(card.id, !card.isActive);
      setConfirming(false);
      onConfirmingChange?.(false);
      onUpdated(updated);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible de modifier le statut de la carte.");
    } finally {
      lock.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="border-t px-6 py-4">
      {confirming ? (
        <form id={panelId} aria-labelledby={titleId} aria-busy={submitting} onSubmit={handleSubmit} className="space-y-3">
          <h3 id={titleId} className="font-semibold">{action} la carte « {card.nickname} » ?</h3>
          <p className="text-sm text-muted-foreground">
            {card.isActive
              ? "La carte sera marquée inactive dans cette application. Son historique sera conservé. Cette action ne bloque pas la carte auprès de votre banque."
              : "La carte sera marquée active dans cette application. Son compte associé, son profil et sa devise doivent être actifs."}
          </p>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" variant={card.isActive ? "destructive" : "default"} disabled={submitting}>{submitting ? "Enregistrement…" : `Confirmer : ${action.toLowerCase()}`}</Button>
            <Button type="button" variant="outline" disabled={submitting} onClick={() => { setConfirming(false); setError(""); onConfirmingChange?.(false); }}>Annuler</Button>
          </div>
        </form>
      ) : (
        <Button type="button" variant="outline" aria-expanded={false} onClick={() => { setError(""); setConfirming(true); onConfirmingChange?.(true); }}>{action}</Button>
      )}
    </div>
  );
}
