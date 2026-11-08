import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, CreditCard, PiggyBank, Wallet, type LucideIcon } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchDashboard, type DashboardData } from "@/features/dashboard/dashboard-api";
import { DashboardCashFlow } from "@/features/dashboard/components/DashboardCashFlow";
import { formatMoney } from "@/lib/format-money";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: DashboardData };

const monthFormatter = new Intl.DateTimeFormat("fr-CA", { month: "long", year: "numeric", timeZone: "UTC" });
const dateFormatter = new Intl.DateTimeFormat("fr-CA", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
const linkClass = "inline-block rounded text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4";
const fieldClass = "ml-2 rounded-lg border border-input bg-background px-3 py-2 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

function Metric({ title, amount, description, icon: Icon }: { title: string; amount: string; description: string; icon: LucideIcon }) {
  return <Card className="min-w-0 rounded-2xl shadow-sm">
    <CardHeader className="flex flex-row items-center justify-between gap-3">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><Icon aria-hidden="true" className="size-5" /></span>
    </CardHeader>
    <CardContent><p className="break-words text-2xl font-semibold tabular-nums">{amount}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></CardContent>
  </Card>;
}

export function DashboardPage() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [currencyCode, setCurrencyCode] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    async function load() {
      try {
        const data = await fetchDashboard(month, currencyCode, controller.signal);
        if (!controller.signal.aborted) setState({ status: "success", data });
      } catch (cause) {
        if (!controller.signal.aborted) setState({ status: "error", message: cause instanceof Error ? cause.message : "Impossible de charger le tableau de bord." });
      }
    }
    void load();
    return () => controller.abort();
  }, [month, currencyCode, refreshKey]);

  function reload() {
    setState({ status: "loading" });
    setRefreshKey((value) => value + 1);
  }
  const data = state.status === "success" ? state.data : null;
  const money = (value: string) => data ? formatMoney(value, data.currency.minorUnit, data.currency.code) : "";

  return <section aria-labelledby="dashboard-title" className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Votre vue d’ensemble</p>
        <h1 id="dashboard-title" className="mt-2 text-3xl font-semibold tracking-tight">Tableau de bord</h1>
        <p className="mt-2 text-sm text-muted-foreground">Vos comptes et opérations enregistrés.</p>
      </div>
      <Button type="button" variant="outline" disabled={state.status === "loading"} onClick={reload}>Actualiser</Button>
    </header>

    <div className="flex flex-wrap items-center gap-4">
      <label className="text-sm font-medium">Mois d’activité
        <input type="month" value={month} min="2000-01" max={new Date().toISOString().slice(0, 7)} className={fieldClass} onChange={(event) => {
          const value = event.target.value;
          if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(value) || value === month) return;
          setState({ status: "loading" });
          setMonth(value);
        }} />
      </label>
      {data && <label className="text-sm font-medium">Devise
        <select value={data.currency.code} className={fieldClass} onChange={(event) => { setCurrencyCode(event.target.value); setState({ status: "loading" }); }}>
          {data.currencies.map((currency) => <option key={currency.code} value={currency.code}>{currency.code}</option>)}
        </select>
      </label>}
    </div>
    {state.status === "loading" && <p role="status" className="rounded-2xl border bg-card p-8 text-muted-foreground">Chargement du tableau de bord…</p>}
    {state.status === "error" && <div className="rounded-2xl border border-destructive/40 bg-card p-6">
      <p role="alert" className="text-destructive">{state.message}</p>
      <Button type="button" variant="outline" onClick={reload} className="mt-4">Réessayer</Button>
    </div>}

    {data && <>
      <p role="status" className="text-sm text-muted-foreground">Activité de {monthFormatter.format(new Date(data.period.start))}. Dates regroupées en UTC. Montants en {data.currency.code}, sans conversion entre devises.</p>
      <Card className="rounded-3xl border-blue-800 bg-blue-950 text-white">
        <CardContent className="p-6 sm:p-8">
          <p className="text-sm font-medium text-blue-200">Solde net actuel des comptes</p>
          <p className="mt-3 break-words text-4xl font-semibold tracking-tight tabular-nums">{money(data.balances.netBalanceMinor)}</p>
          <p className="mt-3 text-sm leading-6 text-blue-100">{data.accountCount} compte(s), actifs et inactifs, en {data.currency.code}. Situation au {dateFormatter.format(new Date(data.asOf))} UTC.</p>
          <Link to="/accounts" className={`${linkClass} mt-5`}>Consulter les comptes</Link>
        </CardContent>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Revenus du mois sélectionné" amount={money(data.activity.incomeMinor)} description="Revenus comptabilisés, hors opérations annulées." icon={ArrowDownLeft} />
        <Metric title="Dépenses du mois sélectionné" amount={money(data.activity.expensesMinor)} description="Dépenses comptabilisées, hors opérations annulées." icon={ArrowUpRight} />
        <Metric title="Épargne actuelle" amount={money(data.balances.savingsMinor)} description="Somme des soldes des comptes d’épargne." icon={PiggyBank} />
        <Metric title="Solde dû actuel : crédit" amount={money(data.balances.creditOutstandingMinor)} description="Somme des montants dus sur les comptes de crédit." icon={CreditCard} />
      </div>
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <DashboardCashFlow months={data.cashFlow} currency={data.currency} />
        <Card className="min-w-0 rounded-2xl">
          <CardHeader><CardTitle>Dernières transactions du mois</CardTitle><p className="mt-2 text-sm text-muted-foreground">Revenus et dépenses comptabilisés en {data.currency.code}.</p></CardHeader>
          <CardContent>
            {data.recentTransactions.length === 0 ? <p className="py-4 text-sm text-muted-foreground">Aucune transaction comptabilisée pour ce mois et cette devise.</p> : <ul className="divide-y divide-border">
              {data.recentTransactions.map((transaction) => <li key={transaction.id} className="py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="break-words text-sm font-medium">{transaction.description}</p>
                  <p className="text-sm font-semibold tabular-nums">{money((transaction.type === "EXPENSE" ? -BigInt(transaction.amountMinor) : BigInt(transaction.amountMinor)).toString())}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{transaction.type === "INCOME" ? "Revenu" : "Dépense"} : {transaction.accountName}</p>
                <time dateTime={transaction.transactionDate} className="mt-1 block text-xs text-muted-foreground">{dateFormatter.format(new Date(transaction.transactionDate))} UTC</time>
              </li>)}
            </ul>}
            <Link to="/transactions" className={`${linkClass} mt-4`}>Consulter les transactions</Link>
          </CardContent>
        </Card>
      </div>
      <Card className="rounded-2xl">
        <CardHeader><CardTitle className="flex items-center gap-2"><Wallet aria-hidden="true" className="size-5" />Comprendre les indicateurs</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
          <p>Le mois sélectionné concerne les revenus, les dépenses et les transactions récentes. Les soldes restent ceux d’aujourd’hui. Les comptes inactifs sont inclus pour conserver une vue complète des montants enregistrés.</p>
          <p>Le solde net inclut l’épargne et les dettes représentées par des soldes négatifs. Il ne correspond pas nécessairement à l’argent disponible pour dépenser.</p>
          <p>Les virements déplacent l’argent entre comptes. Ils ne créent aucun revenu ni dépense. Les transactions et virements annulés sont exclus des calculs.</p>
        </CardContent>
      </Card>
    </>}
  </section>;
}
