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

export const upcomingPaymentsDemo = [
  {
    id: "demo-payment-1",
    description: "Loyer",
    dueDate: "2026-11-01",
    dateLabel: "1 novembre 2026",
    amountMinor: 120000,
    accountName: "Compte principal",
  },
  {
    id: "demo-payment-2",
    description: "Téléphone",
    dueDate: "2026-11-12",
    dateLabel: "12 novembre 2026",
    amountMinor: 7500,
    accountName: "Visa •••• 4821",
  },
  {
    id: "demo-payment-3",
    description: "Internet",
    dueDate: "2026-11-15",
    dateLabel: "15 novembre 2026",
    amountMinor: 8000,
    accountName: "Compte principal",
  },
];

export const budgetOverviewDemo = [
  {
    id: "demo-budget-1",
    category: "Alimentation",
    budgetMinor: 60000,
    spentMinor: 42000,
  },
  {
    id: "demo-budget-2",
    category: "Transport",
    budgetMinor: 25000,
    spentMinor: 22500,
  },
  {
    id: "demo-budget-3",
    category: "Loisirs",
    budgetMinor: 15000,
    spentMinor: 18000,
  },
];

export const paymentCardDemo = {
  nickname: "Visa Horizon",
  cardholderName: "Alex Morgan",
  brand: "VISA",
  last4: "4821",
  creditLimitMinor: 500000,
  outstandingMinor: dashboardDemo.balances.creditOutstanding,
} as const;

export const financialGoalsDemo = [
  {
    id: "demo-goal-1",
    name: "Fonds d’urgence",
    targetMinor: 1000000,
    contributionsMinor: [300000, 150000, 50000],
  },
  {
    id: "demo-goal-2",
    name: "Voyage",
    targetMinor: 300000,
    contributionsMinor: [75000, 25000],
  },
];

type DemoProject = {
  id: string;
  name: string;
  status: "PLANNED" | "ACTIVE";
  budgetMinor: number | null;
  expenseAmountsMinor: number[];
};

export const projectsOverviewDemo: DemoProject[] = [
  {
    id: "demo-project-1",
    name: "Aménagement du bureau",
    status: "ACTIVE",
    budgetMinor: 150000,
    expenseAmountsMinor: [45000, 18000],
  },
  {
    id: "demo-project-2",
    name: "Entretien du véhicule",
    status: "ACTIVE",
    budgetMinor: null,
    expenseAmountsMinor: [12500, 8500],
  },
  {
    id: "demo-project-3",
    name: "Voyage de printemps",
    status: "PLANNED",
    budgetMinor: 300000,
    expenseAmountsMinor: [],
  },
];