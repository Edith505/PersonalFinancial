import { useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { updateCard, type PaymentCard, type UpdateCardInput } from "./cards-api";

interface Props {
  card: PaymentCard;
  onUpdated: (card: PaymentCard) => void;
  onCancel: () => void;
}

const fieldClass = "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function EditCardForm({ card, onUpdated, onCancel }: Props) {
  const titleId = useId();
  const [nickname, setNickname] = useState(card.nickname);
  const [cardholderName, setCardholderName] = useState(card.cardholderName);
  const [expiryMonth, setExpiryMonth] = useState(card.expiryMonth === null ? "" : String(card.expiryMonth));
  const [expiryYear, setExpiryYear] = useState(card.expiryYear === null ? "" : String(card.expiryYear));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const lock = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    setError("");
    const name = nickname.trim().normalize("NFC");
    const holder = cardholderName.trim().normalize("NFC");
    if (!name || name.length > 100 || !holder || holder.length > 100) {
      setError("Le nom et le titulaire doivent contenir de 1 à 100 caractères.");
      return;
    }
    if (Boolean(expiryMonth) !== Boolean(expiryYear)) {
      setError("Renseignez le mois et l’année ensemble, ou videz les deux champs pour effacer l’expiration.");
      return;
    }
    const month = expiryMonth ? Number(expiryMonth) : null;
    const year = expiryYear ? Number(expiryYear) : null;
    if ((month !== null && (!Number.isInteger(month) || month < 1 || month > 12)) ||
        (year !== null && !/^20\d{2}$/.test(expiryYear))) {
      setError("Choisissez un mois de 1 à 12 et une année de 2000 à 2099.");
      return;
    }
    const input: UpdateCardInput = {};
    if (name !== card.nickname) input.nickname = name;
    if (holder !== card.cardholderName) input.cardholderName = holder;
    if (month !== card.expiryMonth || year !== card.expiryYear) {
      input.expiryMonth = month;
      input.expiryYear = year;
    }
    if (Object.keys(input).length === 0) {
      onCancel();
      return;
    }
    lock.current = true;
    setSubmitting(true);
    try {
      onUpdated(await updateCard(card.id, input));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible de modifier la carte.");
    } finally {
      lock.current = false;
      setSubmitting(false);
    }
  }

  return (
    <form aria-labelledby={titleId} aria-busy={submitting} onSubmit={handleSubmit} className="border-t p-6">
      <h3 id={titleId} className="text-lg font-semibold">Modifier la carte</h3>
      <p className="mt-2 text-sm text-muted-foreground">Pour effacer l’expiration, laissez le mois et l’année vides.</p>
      <fieldset disabled={submitting} className="mt-4 space-y-4">
        <legend className="sr-only">Informations modifiables de la carte</legend>
        <label className="block text-sm font-medium">Nom de la carte
          <input required maxLength={100} value={nickname} onChange={(event) => setNickname(event.target.value)} className={fieldClass} />
        </label>
        <label className="block text-sm font-medium">Titulaire
          <input required maxLength={100} value={cardholderName} onChange={(event) => setCardholderName(event.target.value)} className={fieldClass} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-medium">Mois d’expiration
            <select value={expiryMonth} onChange={(event) => setExpiryMonth(event.target.value)} className={fieldClass}>
              <option value="">Non renseigné</option>
              {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => <option key={month} value={month}>{String(month).padStart(2, "0")}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Année d’expiration
            <input type="text" inputMode="numeric" pattern="20[0-9]{2}" maxLength={4} placeholder="AAAA" value={expiryYear} onChange={(event) => setExpiryYear(event.target.value)} className={fieldClass} />
          </label>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={submitting}>{submitting ? "Enregistrement…" : "Enregistrer"}</Button>
          <Button type="button" variant="outline" disabled={submitting} onClick={onCancel}>Annuler</Button>
        </div>
      </fieldset>
    </form>
  );
}
