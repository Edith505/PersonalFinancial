import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Button } from "@/components/ui/button";
import {
  fetchAccountDetails,
  updateAccountDetails,
  type AccountDetails,
  type UpdateAccountPayload,
} from "./accounts-api";

const fieldClass =
  "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

interface Props {
  accountId: string;
  onSaved: (name: string) => void;
  onCancel: () => void;
}

export function EditAccountForm({
  accountId,
  onSaved,
  onCancel,
}: Props) {
  const titleId = useId();
  const [details, setDetails] = useState<AccountDetails | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submissionLock = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const account = await fetchAccountDetails(
          accountId,
          controller.signal,
        );

        if (!controller.signal.aborted) {
          setDetails(account);
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Impossible de charger le compte.",
          );
        }
      }
    }

    void load();

    return () => controller.abort();
  }, [accountId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!details || submissionLock.current) return;

    setError("");

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const institutionName =
      String(form.get("institutionName") ?? "").trim() || null;
    const description =
      String(form.get("description") ?? "").trim() || null;

    if (!name) {
      setError("Le nom du compte est obligatoire.");
      return;
    }

    const payload: UpdateAccountPayload = {};

    if (name !== details.name) {
      payload.name = name;
    }

    if (institutionName !== details.institutionName) {
      payload.institutionName = institutionName;
    }

    if (description !== details.description) {
      payload.description = description;
    }

    if (Object.keys(payload).length === 0) {
      onCancel();
      return;
    }

    submissionLock.current = true;
    setSubmitting(true);

    try {
      const updated = await updateAccountDetails(accountId, payload);
      onSaved(updated.name);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Impossible de modifier le compte.",
      );
    } finally {
      submissionLock.current = false;
      setSubmitting(false);
    }
  }

  return (
    <section
      aria-labelledby={titleId}
      className="mt-4 rounded-xl border bg-muted/30 p-4"
    >
      <h3 id={titleId} className="font-semibold">
        Modifier le compte
      </h3>

      {!details ? (
        <>
          {error ? (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {error} Fermez puis rouvrez le formulaire pour réessayer.
            </p>
          ) : (
            <p role="status" className="mt-3 text-sm text-muted-foreground">
              Chargement des informations…
            </p>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="mt-3"
          >
            Fermer
          </Button>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4">
          <fieldset disabled={submitting} className="space-y-4">
            <legend className="sr-only">
              Informations descriptives
            </legend>

            <label className="block text-sm font-medium">
              Nom du compte
              <input
                name="name"
                defaultValue={details.name}
                required
                maxLength={100}
                className={fieldClass}
              />
            </label>

            <label className="block text-sm font-medium">
              Établissement (facultatif)
              <input
                name="institutionName"
                defaultValue={details.institutionName ?? ""}
                maxLength={120}
                className={fieldClass}
              />
            </label>

            <label className="block text-sm font-medium">
              Description (facultatif)
              <textarea
                name="description"
                defaultValue={details.description ?? ""}
                maxLength={1000}
                rows={3}
                className={fieldClass}
              />
            </label>

            <p className="text-xs text-muted-foreground">
              Videz un champ facultatif pour effacer son contenu.
            </p>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Enregistrement…" : "Enregistrer"}
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
    </section>
  );
}