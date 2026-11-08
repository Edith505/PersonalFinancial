import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/format-money";
import type { DashboardData } from "../dashboard-api";

interface Props { months: DashboardData["cashFlow"]; currency: DashboardData["currency"]; }
const monthFormatter = new Intl.DateTimeFormat("fr-CA", { month: "short", year: "2-digit", timeZone: "UTC" });
const axisFormatter = new Intl.NumberFormat("fr-CA", { notation: "compact", maximumFractionDigits: 1 });

export function DashboardCashFlow({ months, currency }: Props) {
  const [monthCount, setMonthCount] = useState(6);
  const selected = months.slice(-monthCount);
  // Les nombres décimaux servent uniquement au graphique. Le tableau reste exact.
  const data = selected.map((month) => ({
    month: monthFormatter.format(new Date(`${month.month}-01T00:00:00Z`)),
    income: Number(month.incomeMinor) / 10 ** currency.minorUnit,
    expenses: Number(month.expensesMinor) / 10 ** currency.minorUnit,
  }));
  const moneyFormatter = new Intl.NumberFormat("fr-CA", {
    style: "currency", currency: currency.code, currencyDisplay: "code",
    minimumFractionDigits: currency.minorUnit, maximumFractionDigits: currency.minorUnit,
  });
  return <Card className="min-w-0 rounded-2xl">
    <CardHeader className="flex flex-wrap items-start justify-between gap-4 sm:flex-row">
      <div><CardTitle>Revenus et dépenses</CardTitle><p className="mt-2 text-sm text-muted-foreground">Mois regroupés en UTC, jusqu’au mois sélectionné. {currency.code}.</p></div>
      <label className="text-sm">Historique<select value={monthCount} onChange={(event) => setMonthCount(Number(event.target.value))} className="ml-2 rounded-lg border border-input bg-background px-3 py-2 text-foreground"><option value={3}>3 mois</option><option value={6}>6 mois</option></select></label>
    </CardHeader>
    <CardContent>
      <div className="h-72 min-w-0"><ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={data} accessibilityLayer margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
          <YAxis width={52} axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickFormatter={(value: number) => axisFormatter.format(value)} />
          <Tooltip contentStyle={{ backgroundColor: "var(--popover)", color: "var(--popover-foreground)", border: "1px solid var(--border)", borderRadius: 12 }} formatter={(value) => typeof value === "number" ? moneyFormatter.format(value) : "Non disponible"} />
          <Legend wrapperStyle={{ paddingTop: 16 }} />
          <Bar dataKey="income" name="Revenus" fill="#2563eb" radius={[5, 5, 0, 0]} maxBarSize={28} isAnimationActive={false} />
          <Bar dataKey="expenses" name="Dépenses" fill="#94a3b8" radius={[5, 5, 0, 0]} maxBarSize={28} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer></div>
      <details className="mt-5"><summary className="cursor-pointer text-sm font-medium">Afficher les montants exacts</summary>
        <div className="mt-3 overflow-x-auto"><table className="w-full text-sm">
          <caption className="sr-only">Revenus et dépenses mensuels en {currency.code}</caption>
          <thead><tr className="border-b"><th scope="col" className="py-3 text-left">Mois</th><th scope="col" className="px-3 py-3 text-right">Revenus</th><th scope="col" className="py-3 text-right">Dépenses</th></tr></thead>
          <tbody>{selected.map((month) => <tr key={month.month} className="border-b">
            <th scope="row" className="py-3 text-left font-normal">{monthFormatter.format(new Date(`${month.month}-01T00:00:00Z`))}</th>
            <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">{formatMoney(month.incomeMinor, currency.minorUnit, currency.code)}</td>
            <td className="whitespace-nowrap py-3 text-right tabular-nums">{formatMoney(month.expensesMinor, currency.minorUnit, currency.code)}</td>
          </tr>)}</tbody>
        </table></div>
      </details>
    </CardContent>
  </Card>;
}
