import { CalendarDays } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { upcomingPaymentsDemo } from "@/features/dashboard/data/dashboard-demo";

const moneyFormatter = new Intl.NumberFormat("fr-CA", {
  style: "currency",
  currency: "CAD",
  currencyDisplay: "code",
});

export function UpcomingPayments() {
  const totalMinor = upcomingPaymentsDemo.reduce(
    (total, payment) => total + payment.amountMinor,
    0,
  );

  return (
    <Card className="min-w-0 rounded-2xl">
      <CardHeader>
        <CardTitle>Paiements à venir</CardTitle>

        <p className="mt-2 text-sm text-muted-foreground">
          Novembre 2026 · Échéances fictives
        </p>
      </CardHeader>

      <CardContent>
        <ul className="divide-y divide-border">
          {upcomingPaymentsDemo.map((payment) => (
            <li key={payment.id} className="flex gap-3 py-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <CalendarDays aria-hidden="true" className="size-5" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="text-sm font-medium">
                    {payment.description}
                  </p>

                  <p className="text-sm font-semibold tabular-nums">
                    {moneyFormatter.format(payment.amountMinor / 100)}
                  </p>
                </div>

                <time
                  dateTime={payment.dueDate}
                  className="mt-1 block text-xs text-muted-foreground"
                >
                  {payment.dateLabel}
                </time>

                <p className="mt-1 text-xs text-muted-foreground">
                  {payment.accountName}
                </p>

                <span className="mt-2 inline-block rounded-full bg-muted px-2 py-1 text-xs font-medium">
                  Prévu
                </span>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-4 rounded-xl bg-muted p-4">
          <div className="flex flex-wrap justify-between gap-2 text-sm">
            <span>Total des échéances affichées</span>
            <span className="font-semibold tabular-nums">
              {moneyFormatter.format(totalMinor / 100)}
            </span>
          </div>

          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Ces montants ne sont pas inclus dans les dépenses
            comptabilisées du dashboard.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}