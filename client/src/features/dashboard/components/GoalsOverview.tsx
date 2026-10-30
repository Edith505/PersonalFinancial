import { Target } from "lucide-react";
import { Link } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { financialGoalsDemo } from "@/features/dashboard/data/dashboard-demo";

const moneyFormatter = new Intl.NumberFormat("fr-CA", {
  style: "currency",
  currency: "CAD",
  currencyDisplay: "code",
});

export function GoalsOverview() {
  return (
    <Card className="min-w-0 rounded-2xl">
      <CardHeader>
        <CardTitle>Objectifs d’épargne</CardTitle>

        <p className="mt-2 text-sm text-muted-foreground">
          Contributions fictives · Montants en CAD
        </p>
      </CardHeader>

      <CardContent>
        <ul className="space-y-6">
          {financialGoalsDemo.map((goal) => {
            const currentMinor = goal.contributionsMinor.reduce(
              (total, contribution) => total + contribution,
              0,
            );

            const percentage = (currentMinor / goal.targetMinor) * 100;

            const remainingMinor = Math.max(
              goal.targetMinor - currentMinor,
              0,
            );

            return (
              <li key={goal.id} className="rounded-xl border border-border p-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    <Target aria-hidden="true" className="size-5" />
                  </span>

                  <h3 className="text-sm font-semibold">{goal.name}</h3>
                </div>

                <div className="mt-4 flex flex-wrap justify-between gap-2 text-sm">
                  <span className="font-semibold tabular-nums">
                    {moneyFormatter.format(currentMinor / 100)}
                  </span>

                  <span className="text-muted-foreground">
                    sur {moneyFormatter.format(goal.targetMinor / 100)}
                  </span>
                </div>

                <div
                  role="progressbar"
                  aria-label={goal.name}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.min(percentage, 100)}
                  aria-valuetext={`${Math.round(percentage)} % de l’objectif atteint`}
                  className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className="h-full rounded-full bg-blue-600 dark:bg-blue-400"
                    style={{
                      width: `${Math.min(percentage, 100)}%`,
                    }}
                  />
                </div>

                <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                  <span>{Math.round(percentage)} % atteint</span>
                  <span>
                    Reste à constituer :{" "}
                    {moneyFormatter.format(remainingMinor / 100)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="mt-5 text-xs leading-5 text-muted-foreground">
          Les sommes affectées à ces objectifs sont déjà incluses dans
          l’épargne affichée. Elles ne constituent pas un solde supplémentaire.
        </p>

        <Link
          to="/goals"
          className="mt-5 inline-block rounded text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
        >
          Ouvrir le module Goals
        </Link>
      </CardContent>
    </Card>
  );
}