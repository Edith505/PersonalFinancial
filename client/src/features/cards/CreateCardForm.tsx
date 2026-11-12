import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { createCard, fetchCardOptions, type CardOptions, type PaymentCard } from "./cards-api";

interface Props {
  onCreated: (card: PaymentCard) => void;
  onCancel: () => void;
}

type OptionsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: CardOptions };

const fieldClass = "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function CreateCardForm({ onCreated, onCancel }: Props) {
  const titleId = useId();
  const [options, setOptions] = useState<OptionsState>({ status: "loading" });
  const [refreshKey, setRefreshKey] = useState(0);
  const [linkedAccountId, setLinkedAccountId] = useState("");
  const [nickname, setNickname] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [brand, setBrand] = useState<PaymentCard["brand"]>("VISA");
  const [type, setType] = useState<PaymentCard["type"]>("DEBIT");
  const [last4, setLast4] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const lock = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    setOptions({ status: "loading" });
    async function load() {
      try {
        const data = await fetchCardOptions(controller.signal);
        if (!controller.signal.aborted) {
          setOptions({ status: "success", data });
          setLinkedAccountId((current) => data.accounts.some((account) => account.id === current) ? current : "");
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setOptions({ status: "error", message: cause instanceof Error ? cause.message : "Impossible de charger les comptes." });
        }
      }
    }
    void load();
    return () => controller.abort();
  }, [refreshKey]);

  const accounts = options.status === "success" ? options.data.accounts : [];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    setError("");
    if (options.status !== "success" || !accounts.some((account) => account.id === linkedAccountId)) {
      setError("Choisissez un compte disponible.");
      return;
    }
    const cleanName = nickname.trim().normalize("NFC");
    const cleanHolder = cardholderName.trim().normalize("NFC");
    if (!cleanName || cleanName.length > 100 || !cleanHolder || cleanHolder.length > 100) {
      setError("Le nom et le titulaire doivent contenir de 1 à 100 caractères.");
      return;
    }
    if (!/^\d{4}$/.test(last4)) {
      setError("Saisissez exactement quatre chiffres.");
      return;
    }
    if (Boolean(expiryMonth) !== Boolean(expiryYear)) {
      setError("Renseignez le mois et l’année d’expiration ensemble, ou laissez les deux vides.");
      return;
    }
    const month = expiryMonth ? Number(expiryMonth) : null;
    const year = expiryYear ? Number(expiryYear) : null;
    if ((month !== null && (!Number.isInteger(month) || month < 1 || month > 12)) ||
        (year !== null && (!/^20\d{2}$/.test(expiryYear) || !Number.isInteger(year)))) {
      setError("Choisissez un mois de 1 à 12 et une année de 2000 à 2099.");
      return;
    }
    lock.current = true;
    setSubmitting(true);
    try {
      const card = await createCard({
        linkedAccountId, nickname: cleanName, cardholderName: cleanHolder,
        brand, type, last4, expiryMonth: month, expiryYear: year,
      });
      onCreated(card);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible de créer la carte.");
    } finally {
      lock.current = false;
      setSubmitting(false);
    }
  }

  return (
    <section id="create-card-panel" aria-labelledby={titleId} className="rounded-2xl border bg-card p-6 text-card-foreground">
      <h2 id={titleId} className="text-xl font-semibold">Nouvelle carte</h2>
      <p className="mt-2 text-sm text-muted-foreground">Associez la carte à un compte et saisissez ses quatre derniers chiffres. L’expiration est facultative.</p>
      <form onSubmit={handleSubmit} className="mt-5" aria-busy={submitting}>
        <fieldset disabled={submitting} className="space-y-4">
          <legend className="sr-only">Informations de la carte</legend>
          {options.status === "loading" && <p role="status" className="text-sm text-muted-foreground">Chargement des comptes…</p>}
          {options.status === "error" && <p role="alert" className="text-sm text-destructive">{options.message}</p>}
          {options.status === "success" && accounts.length === 0 && <p role="status" className="text-sm text-muted-foreground">Aucun compte disponible. Créez ou réactivez un compte dont le profil et la devise sont actifs.</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">Compte associé
              <select required value={linkedAccountId} onChange={(event) => setLinkedAccountId(event.target.value)} disabled={options.status !== "success" || accounts.length === 0} className={fieldClass}>
                <option value="">Choisir un compte</option>
                {accounts.map((account) => <option key={account.id} value={account.id}>{account.name} · {account.currencyCode} · {account.financialProfile.name}</option>)}
              </select>
            </label>
            <div className="flex items-end">
              <Button type="button" variant="outline" disabled={submitting || options.status === "loading"} onClick={() => {
                setOptions({ status: "loading" });
                setRefreshKey((value) => value + 1);
              }}>Actualiser les comptes</Button>
            </div>
            <label className="text-sm font-medium">Nom de la carte
              <input required maxLength={100} value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="Ex. Carte quotidienne" className={fieldClass} />
            </label>
            <label className="text-sm font-medium">Titulaire
              <input required maxLength={100} value={cardholderName} onChange={(event) => setCardholderName(event.target.value)} className={fieldClass} />
            </label>
            <label className="text-sm font-medium">Réseau
              <select value={brand} onChange={(event) => setBrand(event.target.value as PaymentCard["brand"])} className={fieldClass}>
                <option value="VISA">Visa</option><option value="MASTERCARD">Mastercard</option><option value="AMEX">American Express</option><option value="OTHER">Autre</option>
              </select>
            </label>
            <label className="text-sm font-medium">Type
              <select value={type} onChange={(event) => setType(event.target.value as PaymentCard["type"])} className={fieldClass}>
                <option value="DEBIT">Débit</option><option value="CREDIT">Crédit</option><option value="PREPAID">Prépayée</option><option value="OTHER">Autre</option>
              </select>
            </label>
            <label className="text-sm font-medium">Quatre derniers chiffres
              <input required type="text" inputMode="numeric" autoComplete="off" pattern="[0-9]{4}" minLength={4} maxLength={4} value={last4} onChange={(event) => setLast4(event.target.value)} placeholder="Ex. 0042" className={fieldClass} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-medium">Mois d’expiration
                <select value={expiryMonth} onChange={(event) => setExpiryMonth(event.target.value)} className={fieldClass}>
                  <option value="">Non renseigné</option>
                  {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => <option key={month} value={month}>{String(month).padStart(2, "0")}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium">Année d’expiration
                <input type="text" inputMode="numeric" pattern="20[0-9]{2}" maxLength={4} value={expiryYear} onChange={(event) => setExpiryYear(event.target.value)} placeholder="AAAA" className={fieldClass} />
              </label>
            </div>
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={submitting || options.status !== "success" || accounts.length === 0}>{submitting ? "Création en cours…" : "Créer la carte"}</Button>
            <Button type="button" variant="outline" disabled={submitting} onClick={onCancel}>Annuler</Button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
