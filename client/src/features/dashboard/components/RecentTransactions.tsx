import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Link } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { recentTransactionsDemo } from "@/features/dashboard/data/dashboard-demo";

const moneyFormatter = new Intl.NumberFormat("fr-CA", {
  style: "currency",
  currency: "CAD",
  currencyDisplay: "code",
});

export function RecentTransactions() {
  return (
    <Card className="min-w-0 rounded-2xl">
      <CardHeader>
        <CardTitle>Transactions récentes</CardTitle>
        <p className="mt-2 text-sm text-muted-foreground">
          Extrait fictif · Opérations comptabilisées
        </p>
      </CardHeader>

      <CardContent>
        <ul className="divide-y divide-border">
          {recentTransactionsDemo.map((transaction) => {
            const isIncome = transaction.type === "INCOME";
            const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;

            return (
              <li key={transaction.id} className="flex gap-3 py-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                  <Icon aria-hidden="true" className="size-5" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="text-sm font-medium">
                      {transaction.description}
                    </p>

                    <p className="text-sm font-semibold tabular-nums">
                      {isIncome ? "+" : "−"}
                      {moneyFormatter.format(transaction.amountMinor / 100)}
                    </p>
                  </div>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {isIncome ? "Revenu" : "Dépense"} ·{" "}
                    {transaction.accountName}
                  </p>

                  <p className="text-xs leading-5 text-muted-foreground">
                    {transaction.dateLabel}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        <Link
          to="/transactions"
          className="mt-4 inline-block rounded text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
        >
          Ouvrir le module Transactions
        </Link>
      </CardContent>
    </Card>
  );
}