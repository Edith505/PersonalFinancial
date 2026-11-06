import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { parseMoney } from "@/lib/parse-money";
import {
  createTransaction,
  fetchTransactionOptions,
  type EntryType,
  type Transaction,
  type TransactionOptions,
} from "./transactions-api";

interface Props {
  initialType: EntryType;
  onCreated: (transaction: Transaction) => void;
  onCancel: () => void;
}

const fieldClass =
  "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

function localNow() {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function CreateTransactionForm({ initialType, onCreated, onCancel }: Props) {
  const [options, setOptions] = useState<TransactionOptions | null>(null);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [type, setType] = useState<EntryType>(initialType);
  const [accountId, setAccountId] = useState("");
  const [profileId, setProfileId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const lock = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const data = await fetchTransactionOptions(controller.signal);
        if (controller.signal.aborted) return;
        setOptions(data);
        setAccountId(data.accounts[0]?.id ?? "");
        setProfileId(data.accounts[0]?.financialProfileId ?? data.profiles[0]?.id ?? "");
      } catch (cause) {
        if (!controller.signal.aborted) {
          setLoadError(cause instanceof Error ? cause.message : "Impossible de charger le formulaire.");
        }
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  const account = options?.accounts.find((item) => item.id === accountId);
  const categories = options?.categories.filter((item) => item.type === type) ?? [];
  const selectedCategoryId = categories.some((item) => item.id === categoryId)
    ? categoryId
    : categories[0]?.id ?? "";
  const canCreate = Boolean(account && profileId && selectedCategoryId);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current || !account || !canCreate) return;
    setError("");
    const form = new FormData(event.currentTarget);
    const read = (name: string) => String(form.get(name) ?? "").trim();
    lock.current = true;
    setSubmitting(true);
    try {
      const description = read("description");
      if (!description) throw new Error("La description est obligatoire.");
      const amountMinor = parseMoney(read("amount"), account.minorUnit);
      if (BigInt(amountMinor) <= 0n) throw new Error("Saisissez un montant strictement positif. Le type détermine s’il s’agit d’une entrée ou d’une sortie.");
      const date = new Date(read("date"));
      if (!Number.isFinite(date.getTime()) || date.getTime() > Date.now()) {
        throw new Error("Choisissez une date et une heure valides, au plus tard maintenant.");
      }
      if (date < new Date(account.openingBalanceDate)) {
        throw new Error("La transaction ne peut pas précéder le début du suivi du compte.");
      }
      const merchant = read("merchant");
      const transaction = await createTransaction({
        accountId,
        financialProfileId: profileId,
        categoryId: selectedCategoryId,
        type,
        description,
        amountMinor,
        transactionDate: date.toISOString(),
        ...(merchant ? { merchant } : {}),
      });
      onCreated(transaction);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible d’enregistrer la transaction.");
    } finally {
      lock.current = false;
      setSubmitting(false);
    }
  }

  return (
    <section id="create-transaction-panel" aria-labelledby="create-transaction-title" className="rounded-2xl border bg-card p-6 text-card-foreground">
      <h2 id="create-transaction-title" className="text-xl font-semibold">Nouvelle transaction</h2>
      <p className="mt-2 text-sm text-muted-foreground">Enregistrez une opération déjà réalisée. Pour déplacer de l’argent entre vos comptes, il faudra utiliser un virement.</p>
      {!options ? (
        <>
          {loadError ? <p role="alert" className="mt-4 text-destructive">{loadError} Fermez puis rouvrez le formulaire pour réessayer.</p> : <p role="status" className="mt-4 text-muted-foreground">Chargement du formulaire…</p>}
          <Button type="button" variant="outline" onClick={onCancel} className="mt-4">Fermer</Button>
        </>
      ) : options.accounts.length === 0 || options.profiles.length === 0 ? (
        <div className="mt-4 space-y-3">
          <p role="status">Un compte et un profil actifs sont nécessaires. Vous pouvez gérer vos comptes depuis la <Link to="/accounts" className="underline">page Comptes</Link>.</p>
          <Button type="button" variant="outline" onClick={onCancel}>Fermer</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5" aria-busy={submitting}>
          <fieldset disabled={submitting} className="space-y-4">
            <legend className="sr-only">Informations de la transaction</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">Type
                <select value={type} onChange={(event) => { setType(event.target.value as EntryType); setCategoryId(""); setError(""); }} className={fieldClass}>
                  <option value="EXPENSE">Dépense</option><option value="INCOME">Revenu</option>
                </select>
              </label>
              <label className="text-sm font-medium">Compte
                <select value={accountId} onChange={(event) => {
                  const selected = options.accounts.find((item) => item.id === event.target.value);
                  setAccountId(event.target.value);
                  setProfileId(selected?.financialProfileId ?? "");
                  setError("");
                }} required className={fieldClass}>
                  {options.accounts.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.currencyCode})</option>)}
                </select>
              </label>
              <label className="text-sm font-medium">Profil concerné
                <select value={profileId} onChange={(event) => setProfileId(event.target.value)} required aria-describedby="transaction-profile-help" className={fieldClass}>
                  {options.profiles.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium">Catégorie
                <select value={selectedCategoryId} onChange={(event) => setCategoryId(event.target.value)} required disabled={categories.length === 0} className={fieldClass}>
                  {categories.length === 0 && <option value="">Aucune catégorie disponible</option>}
                  {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium">Montant ({account?.currencyCode})
                <input name="amount" type="text" inputMode="decimal" required maxLength={30} placeholder="Ex. 25,50" className={fieldClass} />
              </label>
              <label className="text-sm font-medium">Date et heure locales
                <input name="date" type="datetime-local" required defaultValue={localNow()} className={fieldClass} />
              </label>
              <label className="text-sm font-medium">Description
                <input name="description" required maxLength={250} placeholder="Ex. Courses alimentaires" className={fieldClass} />
              </label>
              <label className="text-sm font-medium">Tiers ou commerçant (facultatif)
                <input name="merchant" maxLength={120} className={fieldClass} />
              </label>
            </div>
            <p id="transaction-profile-help" className="text-sm text-muted-foreground">Le profil concerné peut être différent du profil du compte utilisé.</p>
            {account && <p className="text-sm text-muted-foreground">Début du suivi du compte : {new Intl.DateTimeFormat("fr-CA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(account.openingBalanceDate))}.</p>}
            {categories.length === 0 && <p role="status" className="text-sm">Créez une catégorie de {type === "INCOME" ? "revenu" : "dépense"} dans la <Link to="/categories" className="underline">page Catégories</Link>, puis rouvrez ce formulaire.</p>}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={submitting || !canCreate}>{submitting ? "Enregistrement…" : "Enregistrer la transaction"}</Button>
              <Button type="button" variant="outline" disabled={submitting} onClick={onCancel}>Annuler</Button>
            </div>
          </fieldset>
        </form>
      )}
    </section>
  );
}
