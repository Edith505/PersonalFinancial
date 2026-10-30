export const dashboardDemo = {
  currency: "CAD",
  periodLabel: "Octobre 2026",
  balances: {
    checking: 425000,
    savings: 800000,
    cash: 15000,
    creditOutstanding: 124560,
  },
  monthlyActivity: {
    income: 520000,
    expenses: 318450,
  },
} as const;

export const monthlyCashFlowDemo = [
  { month: "Mai", income: 480000, expenses: 295000 },
  { month: "Juin", income: 510000, expenses: 342000 },
  { month: "Juil.", income: 495000, expenses: 310000 },
  { month: "Août", income: 540000, expenses: 365000 },
  { month: "Sept.", income: 500000, expenses: 332000 },
  {
    month: "Oct.",
    income: dashboardDemo.monthlyActivity.income,
    expenses: dashboardDemo.monthlyActivity.expenses,
  },
];

type DemoTransaction = {
  id: string;
  dateLabel: string;
  description: string;
  accountName: string;
  amountMinor: number;
  type: "INCOME" | "EXPENSE";
};

export const recentTransactionsDemo: DemoTransaction[] = [
  {
    id: "demo-transaction-1",
    dateLabel: "27 octobre 2026",
    description: "Salaire",
    accountName: "Compte principal",
    amountMinor: 260000,
    type: "INCOME",
  },
  {
    id: "demo-transaction-2",
    dateLabel: "26 octobre 2026",
    description: "Épicerie",
    accountName: "Visa •••• 4821",
    amountMinor: 12345,
    type: "EXPENSE",
  },
  {
    id: "demo-transaction-3",
    dateLabel: "25 octobre 2026",
    description: "Assurance",
    accountName: "Compte principal",
    amountMinor: 12500,
    type: "EXPENSE",
  },
  {
    id: "demo-transaction-4",
    dateLabel: "24 octobre 2026",
    description: "Transport",
    accountName: "Compte principal",
    amountMinor: 5800,
    type: "EXPENSE",
  },
];