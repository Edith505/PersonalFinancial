import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  PiggyBank,
  Wallet,
} from "lucide-react";
import { Link } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatCard } from "@/features/dashboard/components/StatCard";
import { dashboardDemo } from "@/features/dashboard/data/dashboard-demo";
import { CashFlowChart } from "@/features/dashboard/components/CashFlowChart";
import { RecentTransactions } from "@/features/dashboard/components/RecentTransactions";

export function DashboardPage() {
  const { balances, monthlyActivity, currency, periodLabel } =
    dashboardDemo;

  const totalAssets =
    balances.checking + balances.savings + balances.cash;

  const netBalance = totalAssets - balances.creditOutstanding;

  const formattedNetBalance = new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency,
    currencyDisplay: "code",
  }).format(netBalance / 100);

  return (
    <section aria-labelledby="dashboard-title" className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Votre vue d’ensemble
          </p>

          <h1
            id="dashboard-title"
            className="mt-2 text-3xl font-semibold tracking-tight"
          >
            Dashboard
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {periodLabel} · Montants en CAD
          </p>
        </div>

        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
          Données fictives
        </span>
      </header>

      <Card className="rounded-3xl border-blue-800 bg-blue-950 text-white">
        <CardContent className="p-6 sm:p-8">
          <p className="text-sm font-medium text-blue-200">
            Solde net des comptes
          </p>

          <p className="mt-3 break-words text-4xl font-semibold tracking-tight tabular-nums">
            {formattedNetBalance}
          </p>

          <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100">
            Comptes bancaires, épargne et espèces, moins le solde dû
            sur le compte de crédit.
          </p>

          <Link
            to="/accounts"
            className="mt-6 inline-flex items-center gap-2 rounded-lg text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Consulter les comptes
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Revenus du mois"
          amountMinor={monthlyActivity.income}
          currency={currency}
          description="Revenus comptabilisés sur la période."
          icon={ArrowDownLeft}
        />

        <StatCard
          title="Dépenses du mois"
          amountMinor={monthlyActivity.expenses}
          currency={currency}
          description="Dépenses comptabilisées sur la période."
          icon={ArrowUpRight}
        />

        <StatCard
          title="Épargne"
          amountMinor={balances.savings}
          currency={currency}
          description="Solde des comptes d’épargne."
          icon={PiggyBank}
        />

        <StatCard
          title="Solde dû — crédit"
          amountMinor={balances.creditOutstanding}
          currency={currency}
          description="Montant restant à rembourser."
          icon={CreditCard}
        />
      </div>
        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <CashFlowChart />
            <RecentTransactions />
        </div>
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet aria-hidden="true" className="size-5" />
            Comprendre les indicateurs
          </CardTitle>
        </CardHeader>

        <CardContent>
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
            Le solde net inclut l’épargne : il ne représente donc pas
            l’argent librement disponible. Les revenus et dépenses
            correspondent à une période, tandis que les soldes décrivent
            une situation à une date donnée.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}