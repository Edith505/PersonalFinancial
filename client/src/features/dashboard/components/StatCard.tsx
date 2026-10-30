import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

type StatCardProps = {
  title: string;
  amountMinor: number;
  currency: string;
  description: string;
  icon: LucideIcon;
};

export function StatCard({
  title,
  amountMinor,
  currency,
  description,
  icon: Icon,
}: StatCardProps) {
  const formattedAmount = new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency,
    currencyDisplay: "code",
  }).format(amountMinor / 100);

  return (
    <Card className="min-w-0 rounded-2xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {title}
        </h2>

        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          <Icon aria-hidden="true" className="size-5" />
        </span>
      </CardHeader>

      <CardContent>
        <p className="break-words text-2xl font-semibold tracking-tight tabular-nums">
          {formattedAmount}
        </p>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}