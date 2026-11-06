import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { parseMoney } from "@/lib/parse-money";
import { formatMoney } from "@/lib/format-money";
import { createTransfer, fetchTransferOptions, type Transfer, type TransferAccount } from "./transfers-api";

interface Props {
  onCreated: (transfer: Transfer) => void;
  onCancel: () => void;
}

const fieldClass =
  "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const dateFormatter = new Intl.DateTimeFormat("fr-CA", { dateStyle: "medium", timeStyle: "short" });

function localNow() {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function CreateTransferForm({ onCreated, onCancel }: Props) {
  const [accounts, setAccounts] = useState<TransferAccount[] | null>(null);
  const [sourceId, setSourceId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [amount, setAmount] = useState("");
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const lock = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const data = await fetchTransferOptions(controller.signal);
        if (controller.signal.aborted) return;
        setAccounts(data.accounts);
        const firstSource = data.accounts.find((item) => data.accounts.some((other) => other.id !== item.id && other.currencyCode === item.currencyCode));
        setSourceId(firstSource?.id ?? data.accounts[0]?.id ?? "");
      } catch (cause) {
        if (!controller.signal.aborted) setLoadError(cause instanceof Error ? cause.message : "Impossible de charger le formulaire.");
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  const source = accounts?.find((item) => item.id === sourceId);
  const destinations = accounts?.filter((item) => item.id !== sourceId && item.currencyCode === source?.currencyCode) ?? [];
  const destination = destinations.find((item) => item.id === destinationId) ?? destinations[0];
  const earliestDate = source && destination
    ? new Date(Math.max(new Date(source.openingBalanceDate).getTime(), new Date(destination.openingBalanceDate).getTime()))
    : null;

  let previewAmount: string | null = null;
  if (source && amount.trim()) {
    try {
      const parsed = parseMoney(amount, source.minorUnit);
      if (BigInt(parsed) > 0n) previewAmount = formatMoney(parsed, source.minorUnit, source.currencyCode);
    } catch {
      // Le message de validation complet est affiché à la soumission.
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current || !source || !destination || !earliestDate) return;
    setError("");
    const form = new FormData(event.currentTarget);
    lock.current = true;
    setSubmitting(true);
    try {
      const amountMinor = parseMoney(amount, source.minorUnit);
      if (BigInt(amountMinor) <= 0n) throw new Error("Le montant doit être strictement positif.");
      const date = new Date(String(form.get("date") ?? ""));
      if (!Number.isFinite(date.getTime()) || date.getTime() > Date.now()) {
        throw new Error("Choisissez une date et une heure valides, au plus tard maintenant.");
      }
      if (date < earliestDate) throw new Error("Le virement ne peut pas précéder le début du suivi des deux comptes.");
      const description = String(form.get("description") ?? "").trim();
      const transfer = await createTransfer({
        sourceAccountId: source.id,
        destinationAccountId: destination.id,
        amountMinor,
        transferDate: date.toISOString(),
        ...(description ? { description } : {}),
      });
      onCreated(transfer);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible d’enregistrer le virement.");
    } finally {
      lock.current = false;
      setSubmitting(false);
    }
  }

  return (
    <section id="create-transfer-panel" aria-labelledby="create-transfer-title" className="rounded-2xl border bg-card p-6 text-card-foreground">
      <h2 id="create-transfer-title" className="text-xl font-semibold">Nouveau virement</h2>
      <p className="mt-2 text-sm text-muted-foreground">Enregistrez un virement déjà effectué entre deux de vos comptes de même devise. Cette saisie ne déclenche pas de transfert bancaire.</p>
      {!accounts ? <>
        {loadError ? <p role="alert" className="mt-4 text-destructive">{loadError} Fermez puis rouvrez le formulaire pour réessayer.</p> : <p role="status" className="mt-4 text-muted-foreground">Chargement des comptes…</p>}
        <Button type="button" variant="outline" onClick={onCancel} className="mt-4">Fermer</Button>
      </> : accounts.length < 2 ? <div className="mt-4 space-y-3">
        <p>Deux comptes actifs sont nécessaires. Vous pouvez les gérer depuis la <Link to="/accounts" className="underline">page Comptes</Link>.</p>
        <Button type="button" variant="outline" onClick={onCancel}>Fermer</Button>
      </div> : <form onSubmit={handleSubmit} className="mt-5" aria-busy={submitting}>
        <fieldset disabled={submitting} className="space-y-4">
          <legend className="sr-only">Informations du virement</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">Compte à débiter
              <select value={sourceId} required onChange={(event) => { setSourceId(event.target.value); setDestinationId(""); setAmount(""); setError(""); }} className={fieldClass}>
                {accounts.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.currencyCode})</option>)}
              </select>
            </label>
            <label className="text-sm font-medium">Compte à créditer
              <select value={destination?.id ?? ""} required disabled={destinations.length === 0} onChange={(event) => { setDestinationId(event.target.value); setError(""); }} className={fieldClass}>
                {destinations.length === 0 && <option value="">Aucun compte de même devise</option>}
                {destinations.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.currencyCode})</option>)}
              </select>
            </label>
            <label className="text-sm font-medium">Montant ({source?.currencyCode})
              <input name="amount" value={amount} onChange={(event) => setAmount(event.target.value)} type="text" inputMode="decimal" required maxLength={30} placeholder="Ex. 50,00" className={fieldClass} />
            </label>
            <label className="text-sm font-medium">Date et heure locales
              <input name="date" type="datetime-local" required defaultValue={localNow()} className={fieldClass} />
            </label>
            <label className="text-sm font-medium sm:col-span-2">Description (facultatif)
              <input name="description" maxLength={250} placeholder="Ex. Mise de côté pour les vacances" className={fieldClass} />
            </label>
          </div>
          {earliestDate && <p className="text-sm text-muted-foreground">Date minimale pour ces deux comptes : {dateFormatter.format(earliestDate)}.</p>}
          {!destination && <p role="status" className="text-sm text-muted-foreground">Choisissez un autre compte source ou ajoutez un compte de même devise dans la page Comptes.</p>}
          {previewAmount && source && destination && <div className="space-y-1 rounded-xl bg-muted/50 p-4 text-sm" aria-label="Résumé du virement">
            <p><strong>{source.name}</strong> : débit de {previewAmount}.</p>
            <p><strong>{destination.name}</strong> : crédit de {previewAmount}.</p>
            <p className="text-muted-foreground">Aucun revenu ni dépense ne sera créé.</p>
          </div>}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={submitting || !destination}>{submitting ? "Enregistrement…" : "Enregistrer le virement"}</Button>
            <Button type="button" variant="outline" disabled={submitting} onClick={onCancel}>Annuler</Button>
          </div>
        </fieldset>
      </form>}
    </section>
  );
}
