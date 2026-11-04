import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchAccounts,
  type AccountType,
  type AccountsResponse,
} from "@/features/accounts/accounts-api";
import { formatMoney } from "@/lib/format-money";
import { CreateAccountForm } from "@/features/accounts/CreateAccountForm";
import { AccountStatusActions } from "@/features/accounts/AccountStatusActions";

const accountTypeLabels: Record<AccountType, string> = {
  CHECKING: "Compte courant",
  SAVINGS: "Épargne",
  CASH: "Espèces",
  CREDIT: "Crédit",
  LIABILITY: "Dette",
  INVESTMENT: "Placement",
  MOBILE_MONEY: "Argent mobile",
  OTHER: "Autre",
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: AccountsResponse };

export function AccountsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [state, setState] = useState<LoadState>({
    status: "loading",
  });

  useEffect(() => {
    const controller = new AbortController();

    setState({ status: "loading" });

    async function load() {
      try {
        const data = await fetchAccounts(page, controller.signal);

        if (!controller.signal.aborted) {
          setState({ status: "success", data });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Une erreur empêche le chargement des comptes.",
          });
        }
      }
    }

    void load();

    return () => controller.abort();
  }, [page, refreshKey]);

  function reload() {
    setState({ status: "loading" });
    setRefreshKey((current) => current + 1);
  }

  function changePage(nextPage: number) {
    setState({ status: "loading" });
    setPage(nextPage);
  }

  return (
    <section aria-labelledby="accounts-title" className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Votre espace financier
          </p>

          <h1
            id="accounts-title"
            className="mt-1 text-3xl font-semibold tracking-tight"
          >
            Comptes
          </h1>

          <p className="mt-2 text-muted-foreground">
            Consultez vos soldes et les comptes de vos profils.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={reload}
            disabled={state.status === "loading"}
          >
            Actualiser
          </Button>

          <Button
            type="button"
            aria-expanded={showCreateForm}
            aria-controls={showCreateForm ? "create-account-panel" : undefined}
            disabled={showCreateForm}
            onClick={() => {
              setSuccessMessage("");
              setShowCreateForm(true);
            }}
          >
            Nouveau compte
          </Button>
        </div>
      </header>

      {successMessage && (
        <p
          role="status"
          className="rounded-xl bg-emerald-50 p-4 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
        >
          {successMessage}
        </p>
      )}

      {showCreateForm && (
        <CreateAccountForm
          onCancel={() => setShowCreateForm(false)}
          onCreated={(account) => {
            setShowCreateForm(false);
            setSuccessMessage(`Le compte « ${account.name} » a été créé.`);

            // Les comptes sont classés du plus ancien au plus récent.
            setPage(1);
            reload();
          }}
        />
      )}

      {state.status === "loading" && (
        <div
          role="status"
          className="rounded-2xl border bg-card p-8 text-muted-foreground"
        >
          Chargement des comptes…
        </div>
      )}

      {state.status === "error" && (
        <div className="rounded-2xl border border-destructive/40 bg-card p-6">
          <p role="alert" className="text-destructive">
            {state.message}
          </p>

          <Button
            type="button"
            variant="outline"
            onClick={reload}
            className="mt-4"
          >
            Réessayer
          </Button>
        </div>
      )}

      {state.status === "success" && (
        <>
          <p role="status" className="text-sm text-muted-foreground">
            {state.data.pagination.total} compte(s) enregistré(s)
            {" · "}
            Soldes au{" "}
            {new Intl.DateTimeFormat("fr-CA", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(state.data.asOf))}
          </p>

          {state.data.items.length === 0 ? (
            <div className="rounded-2xl border bg-card p-8">
              <h2 className="text-lg font-semibold">
                {state.data.pagination.total === 0
                  ? "Aucun compte pour le moment"
                  : "Aucun compte sur cette page"}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {state.data.pagination.total === 0
                  ? "Vos comptes apparaîtront ici après leur création."
                  : "Revenez à la page précédente pour consulter vos comptes."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {state.data.items.map((account) => (
                <article
                  key={account.id}
                  className="rounded-2xl border bg-card p-6 text-card-foreground shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Wallet aria-hidden="true" className="size-5" />
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        account.isActive
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {account.isActive ? "Actif" : "Inactif"}
                    </span>
                  </div>

                  <h2 className="mt-5 break-words text-lg font-semibold">
                    {account.name}
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {accountTypeLabels[account.type]}
                  </p>

                  <p className="mt-5 text-sm text-muted-foreground">
                    Solde
                  </p>

                  <p
                    className={`mt-1 break-words text-2xl font-semibold tabular-nums ${
                      BigInt(account.balanceMinor) < 0n
                        ? "text-red-700 dark:text-red-400"
                        : ""
                    }`}
                  >
                    {formatMoney(
                      account.balanceMinor,
                      account.minorUnit,
                      account.currencyCode,
                    )}
                  </p>

                  <p className="mt-5 border-t pt-4 text-sm text-muted-foreground">
                    {account.financialProfile.name}
                  </p>

                 <AccountStatusActions
                    account={account}
                    onChanged={(isActive) => {
                      setSuccessMessage(
                        `Le compte « ${account.name} » a été ${
                          isActive ? "réactivé" : "désactivé"
                        }.`,
                      );
                      reload();
                    }}
                  /> 
                </article>
              ))}
            </div>
          )}

          <nav
            aria-label="Pagination des comptes"
            className="flex flex-wrap items-center justify-between gap-4"
          >
            <Button
              type="button"
              variant="outline"
              disabled={page <= 1}
              onClick={() => changePage(page - 1)}
            >
              Précédent
            </Button>

            <span className="text-sm text-muted-foreground">
              Page {page} sur{" "}
              {Math.max(1, state.data.pagination.totalPages)}
            </span>

            <Button
              type="button"
              variant="outline"
              disabled={page >= state.data.pagination.totalPages}
              onClick={() => changePage(page + 1)}
            >
              Suivant
            </Button>
          </nav>
        </>
      )}
    </section>
  );
}