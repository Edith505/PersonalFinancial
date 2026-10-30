import { Link } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { budgetOverviewDemo } from "@/features/dashboard/data/dashboard-demo";

const moneyFormatter = new Intl.NumberFormat("fr-CA", {
  style: "currency",
  currency: "CAD",
  currencyDisplay: "code",
});

function getBudgetState(percentage: number) {
  if (percentage > 100) {
    return {
      label: "Dépassé",
      textClass: "text-red-700 dark:text-red-300",
      barClass: "bg-red-600 dark:bg-red-400",
    };
  }

  if (percentage >= 80) {
    return {
      label: "Vigilance",
      textClass: "text-amber-800 dark:text-amber-300",
      barClass: "bg-amber-600 dark:bg-amber-400",
    };
  }

  return {
    label: "Dans le budget",
    textClass: "text-blue-700 dark:text-blue-300",
    barClass: "bg-blue-600 dark:bg-blue-400",
  };
}

export function BudgetOverview() {
  return (
    <Card className="min-w-0 rounded-2xl">
      <CardHeader>
        <CardTitle>Aperçu des budgets</CardTitle>

        <p className="mt-2 text-sm text-muted-foreground">
          Octobre 2026 · Sélection de catégories fictives
        </p>
      </CardHeader>

      <CardContent>
        <ul className="space-y-6">
          {budgetOverviewDemo.map((budget) => {
            const percentage =
              (budget.spentMinor / budget.budgetMinor) * 100;

            const remainingMinor =
              budget.budgetMinor - budget.spentMinor;

            const state = getBudgetState(percentage);
            const displayedPercentage = Math.round(percentage);

            return (
              <li key={budget.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">
                    {budget.category}
                  </h3>

                  <span className={`text-xs font-medium ${state.textClass}`}>
                    {state.label}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    Dépensé :{" "}
                    {moneyFormatter.format(budget.spentMinor / 100)}
                  </span>

                  <span>
                    Budget :{" "}
                    {moneyFormatter.format(budget.budgetMinor / 100)}
                  </span>
                </div>

                <div
                  role="progressbar"
                  aria-label={`Budget ${budget.category}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.min(percentage, 100)}
                  aria-valuetext={`${displayedPercentage} % du budget utilisé — ${state.label}`}
                  className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className={`h-full rounded-full ${state.barClass}`}
                    style={{
                      width: `${Math.min(percentage, 100)}%`,
                    }}
                  />
                </div>

                <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs">
                  <span className="text-muted-foreground">
                    {displayedPercentage} % utilisé
                  </span>

                  <span className={state.textClass}>
                    {remainingMinor >= 0
                      ? `Reste : ${moneyFormatter.format(remainingMinor / 100)}`
                      : `Dépassement : ${moneyFormatter.format(
                          Math.abs(remainingMinor) / 100,
                        )}`}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>

        <Link
          to="/budgets"
          className="mt-6 inline-block rounded text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
        >
          Ouvrir le module Budgets
        </Link>
      </CardContent>
    </Card>
  );
}