import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { monthlyCashFlowDemo } from "@/features/dashboard/data/dashboard-demo";

const moneyFormatter = new Intl.NumberFormat("fr-CA", {
  style: "currency",
  currency: "CAD",
  currencyDisplay: "code",
});

const axisFormatter = new Intl.NumberFormat("fr-CA", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function CashFlowChart() {
  const [monthCount, setMonthCount] = useState(6);

  const data = monthlyCashFlowDemo.slice(-monthCount).map((month) => ({
    month: month.month,
    income: month.income / 100,
    expenses: month.expenses / 100,
  }));

  return (
    <Card className="min-w-0 rounded-2xl">
      <CardHeader className="flex flex-wrap items-start justify-between gap-4 sm:flex-row">
        <div>
          <CardTitle>Revenus et dépenses</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            Comparaison mensuelle · CAD · Données fictives
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="cash-flow-period" className="text-sm">
            Période
          </label>

          <select
            id="cash-flow-period"
            value={monthCount}
            onChange={(event) => setMonthCount(Number(event.target.value))}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <option value={3}>3 mois</option>
            <option value={6}>6 mois</option>
          </select>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-72 min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart
              data={data}
              accessibilityLayer
              margin={{ top: 12, right: 8, bottom: 0, left: 0 }}
            >
              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                tickMargin={10}
              />

              <YAxis
                width={44}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                tickFormatter={(value: number) =>
                  axisFormatter.format(value)
                }
              />

              <Tooltip
                cursor={{ fill: "var(--muted)", fillOpacity: 0.5 }}
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  color: "var(--popover-foreground)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                }}
                formatter={(value) =>
                  typeof value === "number"
                    ? moneyFormatter.format(value)
                    : "—"
                }
              />

              <Legend wrapperStyle={{ paddingTop: 16 }} />

              <Bar
                dataKey="income"
                name="Revenus"
                fill="#2563eb"
                radius={[5, 5, 0, 0]}
                maxBarSize={28}
                isAnimationActive={false}
              />

              <Bar
                dataKey="expenses"
                name="Dépenses"
                fill="#94a3b8"
                radius={[5, 5, 0, 0]}
                maxBarSize={28}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <details className="mt-5">
          <summary className="cursor-pointer rounded text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600">
            Afficher les valeurs du graphique
          </summary>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">
                Revenus et dépenses mensuels fictifs en dollars canadiens
              </caption>

              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="py-3 text-left">
                    Mois
                  </th>
                  <th scope="col" className="px-3 py-3 text-right">
                    Revenus
                  </th>
                  <th scope="col" className="py-3 text-right">
                    Dépenses
                  </th>
                </tr>
              </thead>

              <tbody>
                {data.map((month) => (
                  <tr key={month.month} className="border-b border-border">
                    <th scope="row" className="py-3 text-left font-normal">
                      {month.month}
                    </th>
                    <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">
                      {moneyFormatter.format(month.income)}
                    </td>
                    <td className="whitespace-nowrap py-3 text-right tabular-nums">
                      {moneyFormatter.format(month.expenses)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}