import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchTransactionFilterOptions, type TransactionFilterOptions } from "./transactions-api";

interface Props {
  accountId: string;
  profileId: string;
  onChange: (accountId: string, profileId: string) => void;
}

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: TransactionFilterOptions };

const fieldClass = "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function TransactionScopeFilters({ accountId, profileId, onChange }: Props) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    async function load() {
      try {
        const data = await fetchTransactionFilterOptions(controller.signal);
        if (!controller.signal.aborted) setState({ status: "success", data });
      } catch (cause) {
        if (!controller.signal.aborted) setState({ status: "error", message: cause instanceof Error ? cause.message : "Impossible de charger les filtres." });
      }
    }
    void load();
    return () => controller.abort();
  }, [refreshKey]);

  function reload() {
    setState({ status: "loading" });
    setRefreshKey((value) => value + 1);
  }

  return (
    <section aria-label="Filtres par compte et profil" className="space-y-3 rounded-2xl border bg-card p-5">
      {state.status === "loading" && <p role="status" className="text-sm text-muted-foreground">Chargement des filtres…</p>}
      {state.status === "error" && <p role="alert" className="text-sm text-destructive">{state.message}</p>}
      {state.status === "success" && <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">Compte
          <select value={accountId} onChange={(event) => onChange(event.target.value, profileId)} className={fieldClass}>
            <option value="">Tous les comptes</option>
            {accountId && !state.data.accounts.some((account) => account.id === accountId) && <option value={accountId}>Compte indisponible</option>}
            {state.data.accounts.map((account) => <option key={account.id} value={account.id}>{account.name} ({account.currencyCode}){!account.isActive && " · Inactif"}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Profil concerné
          <select value={profileId} onChange={(event) => onChange(accountId, event.target.value)} className={fieldClass}>
            <option value="">Tous les profils</option>
            {profileId && !state.data.profiles.some((profile) => profile.id === profileId) && <option value={profileId}>Profil indisponible</option>}
            {state.data.profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}{!profile.isActive && " · Inactif"}</option>)}
          </select>
        </label>
      </div>}
      <p className="text-sm text-muted-foreground">Le profil concerné est celui de la transaction. Il peut différer du profil du compte. Les comptes et profils inactifs restent consultables.</p>
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" disabled={!accountId && !profileId} onClick={() => onChange("", "")}>Tous les comptes et profils</Button>
        <Button type="button" variant="outline" disabled={state.status === "loading"} onClick={reload}>{state.status === "error" ? "Réessayer les filtres" : "Actualiser les choix"}</Button>
      </div>
    </section>
  );
}
