import { CreditCard } from "lucide-react";
import { Link } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { paymentCardDemo } from "@/features/dashboard/data/dashboard-demo";

const moneyFormatter = new Intl.NumberFormat("fr-CA", {
  style: "currency",
  currency: "CAD",
  currencyDisplay: "code",
});

export function PaymentCardOverview() {
  const card = paymentCardDemo;

  const availableCreditMinor =
    card.creditLimitMinor - card.outstandingMinor;

  return (
    <Card className="min-w-0 rounded-2xl">
      <CardHeader>
        <CardTitle>Mes cartes</CardTitle>

        <p className="mt-2 text-sm text-muted-foreground">
          Carte fictive · Aucun service de paiement
        </p>
      </CardHeader>

      <CardContent>
        <div className="rounded-2xl bg-slate-900 p-6 text-white dark:bg-slate-800">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-200">
              {card.nickname}
            </span>

            <span className="text-lg font-bold tracking-wider">
              {card.brand}
            </span>
          </div>

          <CreditCard
            aria-hidden="true"
            className="mt-6 size-8 text-blue-200"
          />

          <p
            aria-label={`Carte se terminant par ${card.last4}`}
            className="mt-4 text-2xl font-medium tracking-widest"
          >
            •••• {card.last4}
          </p>

          <div className="mt-6 flex flex-wrap justify-between gap-2 text-xs">
            <span>{card.cardholderName}</span>
            <span className="text-slate-300">Carte de crédit</span>
          </div>
        </div>

        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted-foreground">Solde dû</dt>
            <dd className="font-semibold tabular-nums">
              {moneyFormatter.format(card.outstandingMinor / 100)}
            </dd>
          </div>

          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted-foreground">Limite de crédit</dt>
            <dd className="tabular-nums">
              {moneyFormatter.format(card.creditLimitMinor / 100)}
            </dd>
          </div>

          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted-foreground">Crédit disponible</dt>
            <dd className="font-semibold tabular-nums">
              {moneyFormatter.format(availableCreditMinor / 100)}
            </dd>
          </div>
        </dl>

        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          Le crédit disponible est une capacité d’emprunt. Il n’est pas
          inclus dans votre argent disponible ni dans votre solde net.
        </p>

        <Link
          to="/cards"
          className="mt-5 inline-block rounded text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
        >
          Ouvrir le module Cards
        </Link>
      </CardContent>
    </Card>
  );
}