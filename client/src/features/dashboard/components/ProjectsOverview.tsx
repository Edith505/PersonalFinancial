import { FolderOpen } from "lucide-react";
import { Link } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { projectsOverviewDemo } from "@/features/dashboard/data/dashboard-demo";

const moneyFormatter = new Intl.NumberFormat("fr-CA", {
  style: "currency",
  currency: "CAD",
  currencyDisplay: "code",
});

const statusLabels = {
  PLANNED: "Planifié",
  ACTIVE: "En cours",
};

export function ProjectsOverview() {
  return (
    <Card className="min-w-0 rounded-2xl">
      <CardHeader>
        <CardTitle>Aperçu des projets</CardTitle>

        <p className="mt-2 text-sm text-muted-foreground">
          Projets fictifs · Dépenses cumulées en CAD
        </p>
      </CardHeader>

      <CardContent>
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projectsOverviewDemo.map((project) => {
            const totalSpentMinor = project.expenseAmountsMinor.reduce(
              (total, amount) => total + amount,
              0,
            );

            const budgetMinor = project.budgetMinor;

            const remainingMinor =
              budgetMinor === null
                ? null
                : budgetMinor - totalSpentMinor;

            const percentage =
              budgetMinor !== null && budgetMinor > 0
                ? (totalSpentMinor / budgetMinor) * 100
                : null;

            return (
              <li
                key={project.id}
                className="min-w-0 rounded-2xl border border-border p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    <FolderOpen aria-hidden="true" className="size-5" />
                  </span>

                  <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">
                    {statusLabels[project.status]}
                  </span>
                </div>

                <h3 className="mt-4 text-base font-semibold">
                  {project.name}
                </h3>

                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt className="text-muted-foreground">
                      Dépenses cumulées
                    </dt>
                    <dd className="font-semibold tabular-nums">
                      {moneyFormatter.format(totalSpentMinor / 100)}
                    </dd>
                  </div>

                  <div className="flex flex-wrap justify-between gap-2">
                    <dt className="text-muted-foreground">Budget</dt>
                    <dd className="tabular-nums">
                      {budgetMinor === null
                        ? "Non défini"
                        : moneyFormatter.format(budgetMinor / 100)}
                    </dd>
                  </div>
                </dl>

                {percentage !== null && (
                  <div className="mt-4">
                    <div
                      role="progressbar"
                      aria-label={`Consommation du budget : ${project.name}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.min(percentage, 100)}
                      aria-valuetext={`${Math.round(percentage)} % du budget utilisé`}
                      className="h-2 overflow-hidden rounded-full bg-muted"
                    >
                      <div
                        className="h-full rounded-full bg-blue-600 dark:bg-blue-400"
                        style={{
                          width: `${Math.min(percentage, 100)}%`,
                        }}
                      />
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground">
                      {Math.round(percentage)} % du budget utilisé
                    </p>
                  </div>
                )}

                <p className="mt-4 text-xs leading-5 text-muted-foreground">
                  {remainingMinor === null
                    ? "Suivi des dépenses sans plafond budgétaire."
                    : remainingMinor >= 0
                      ? `Budget restant : ${moneyFormatter.format(
                          remainingMinor / 100,
                        )}`
                      : `Budget dépassé de ${moneyFormatter.format(
                          Math.abs(remainingMinor) / 100,
                        )}`}
                </p>
              </li>
            );
          })}
        </ul>

        <p className="mt-5 text-xs leading-5 text-muted-foreground">
          Le pourcentage indique la consommation du budget, pas
          l’avancement réel des travaux.
        </p>

        <Link
          to="/projects"
          className="mt-4 inline-block rounded text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
        >
          Ouvrir le module Projects
        </Link>
      </CardContent>
    </Card>
  );
}