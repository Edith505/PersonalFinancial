import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { parseMoney } from "@/lib/parse-money";
import {
  createAccount,
  fetchAccountOptions,
  type Account,
  type AccountOptions,
  type AccountType,
} from "./accounts-api";

const types: Array<{ value: AccountType; label: string }> = [
  { value: "CHECKING", label: "Compte courant" },
  { value: "SAVINGS", label: "Épargne" },
  { value: "CASH", label: "Espèces" },
  { value: "CREDIT", label: "Crédit" },
  { value: "LIABILITY", label: "Dette" },
  { value: "INVESTMENT", label: "Placement" },
  { value: "MOBILE_MONEY", label: "Argent mobile" },
  { value: "OTHER", label: "Autre" },
];

const fieldClass =
  "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

function localToday() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

interface Props {
  onCreated: (account: Account) => void;
  onCancel: () => void;
}

export function CreateAccountForm({ onCreated, onCancel }: Props) {
  const [options, setOptions] = useState<AccountOptions | null>(null);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [type, setType] = useState<AccountType>("CHECKING");
  const [currencyCode, setCurrencyCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submissionLock = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const data = await fetchAccountOptions(controller.signal);

        if (controller.signal.aborted) return;

        setOptions(data);
        setCurrencyCode(
          data.currencies.find((currency) => currency.code === "CAD")
            ?.code ??
            data.currencies[0]?.code ??
            "",
        );
      } catch (cause) {
        if (!controller.signal.aborted) {
          setLoadError(
            cause instanceof Error
              ? cause.message
              : "Impossible de charger le formulaire.",
          );
        }
      }
    }

    void load();

    return () => controller.abort();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submissionLock.current || !options) return;

    setError("");

    const form = new FormData(event.currentTarget);
    const read = (key: string) => String(form.get(key) ?? "").trim();

    const currency = options.currencies.find(
      (item) => item.code === currencyCode,
    );

    if (!currency) {
      setError("Choisissez une devise disponible.");
      return;
    }

    submissionLock.current = true;
    setSubmitting(true);

    try {
      const name = read("name");

      if (!name) {
        throw new Error("Le nom du compte est obligatoire.");
      }

      const date = new Date(`${read("openingDate")}T00:00:00`);

      if (
        !Number.isFinite(date.getTime()) ||
        date.getTime() > Date.now()
      ) {
        throw new Error("Choisissez une date valide, au plus tard aujourd’hui.");
      }

      const openingBalanceMinor = parseMoney(
        read("openingBalance"),
        currency.minorUnit,
      );

      const limitText = read("creditLimit");
      let creditLimitMinor: string | undefined;

      if (type === "CREDIT" && limitText) {
        creditLimitMinor = parseMoney(limitText, currency.minorUnit);

        if (BigInt(creditLimitMinor) <= 0n) {
          throw new Error("La limite de crédit doit être positive.");
        }
      }

      const account = await createAccount({
        financialProfileId: read("profileId"),
        name,
        type,
        currencyCode,
        openingBalanceMinor,
        openingBalanceDate: date.toISOString(),
        ...(creditLimitMinor !== undefined
          ? { creditLimitMinor }
          : {}),
      });

      onCreated(account);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Impossible de créer le compte.",
      );
    } finally {
      submissionLock.current = false;
      setSubmitting(false);
    }
  }

  const unavailable =
    options !== null &&
    (options.profiles.length === 0 || options.currencies.length === 0);

  return (
    <section
      id="create-account-panel"
      aria-labelledby="create-account-title"
      className="rounded-2xl border bg-card p-6 text-card-foreground"
    >
      <h2 id="create-account-title" className="text-xl font-semibold">
        Nouveau compte
      </h2>

      {loadError ? (
        <p role="alert" className="mt-4 text-destructive">
          {loadError} Fermez puis rouvrez le formulaire pour réessayer.
        </p>
      ) : !options ? (
        <p role="status" className="mt-4 text-muted-foreground">
          Chargement du formulaire…
        </p>
      ) : unavailable ? (
        <p role="alert" className="mt-4 text-muted-foreground">
          Un profil actif et une devise active sont nécessaires.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <fieldset disabled={submitting} className="space-y-5">
            <legend className="sr-only">Informations du compte</legend>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Nom du compte
                <input
                  name="name"
                  required
                  maxLength={100}
                  placeholder="Ex. Épargne vacances"
                  className={fieldClass}
                />
              </label>

              <label className="text-sm font-medium">
                Profil
                <select name="profileId" required className={fieldClass}>
                  {options.profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium">
                Type de compte
                <select
                  value={type}
                  onChange={(event) =>
                    setType(event.target.value as AccountType)
                  }
                  className={fieldClass}
                >
                  {types.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium">
                Devise
                <select
                  value={currencyCode}
                  onChange={(event) => setCurrencyCode(event.target.value)}
                  required
                  className={fieldClass}
                >
                  {options.currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium">
                Solde initial ({currencyCode})
                <input
                  name="openingBalance"
                  type="text"
                  inputMode="decimal"
                  defaultValue="0"
                  required
                  maxLength={30}
                  aria-describedby="opening-balance-help"
                  className={fieldClass}
                />
              </label>

              <label className="text-sm font-medium">
                Date de début du suivi
                <input
                  name="openingDate"
                  type="date"
                  defaultValue={localToday()}
                  max={localToday()}
                  required
                  aria-describedby="opening-balance-help"
                  className={fieldClass}
                />
              </label>

              {type === "CREDIT" && (
                <label className="text-sm font-medium">
                  Limite de crédit ({currencyCode}, facultatif)
                  <input
                    name="creditLimit"
                    type="text"
                    inputMode="decimal"
                    maxLength={30}
                    placeholder="Ex. 5000,00"
                    className={fieldClass}
                  />
                </label>
              )}
            </div>

            <p
              id="opening-balance-help"
              className="text-sm text-muted-foreground"
            >
              Indiquez le solde au début de cette journée, à minuit dans
              votre fuseau local. Les mouvements seront comptés à partir
              de cette date. Une dette initiale se saisit avec un signe
              moins, par exemple −250.
            </p>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Création en cours…" : "Créer le compte"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={submitting}
              >
                Annuler
              </Button>
            </div>
          </fieldset>
        </form>
      )}

      {(!options || unavailable) && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="mt-4"
        >
          Fermer
        </Button>
      )}
    </section>
  );
}