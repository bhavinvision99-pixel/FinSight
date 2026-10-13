export type TransactionType = 'income' | 'expense' | 'loan' | 'equity' | 'transfer';
export type PaymentStatus = 'paid' | 'unpaid' | 'overdue' | 'pending';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  invoiceDate?: string;
  dueDate?: string;
  paymentDate?: string;
  year: number;
  month: number; // 1-12
  description: string;
  counterparty: string; // Customer or Supplier
  type: TransactionType;
  category: string;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  status: PaymentStatus;
  isRecurring: boolean;
  paymentMethod?: string;
  isDuplicate?: boolean;
  validationWarnings?: string[];
  rawSource?: Record<string, string>;
}

export interface ValidationIssue {
  row: number;
  transactionId: string;
  type: 'duplicate' | 'invalid_date' | 'invalid_amount' | 'unknown_type' | 'vat_mismatch' | 'potential_double_count' | 'unmapped_category';
  message: string;
  severity: 'warning' | 'error';
}

export interface ReconciliationSummary {
  totalRecords: number;
  validRecords: number;
  warningsCount: number;
  totalOperatingRevenueNet: number;
  totalOperatingExpenseNet: number;
  operatingProfitNet: number;
  totalVatCollected: number;
  totalVatPaid: number;
  netVatPayable: number;
  unpaidInvoicesCount: number;
  unpaidInvoicesNet: number;
  nonOperatingIncome: number; // loans, equity
  nonOperatingTransfers: number;
  yearsCovered: number[];
  earliestDate: string;
  latestDate: string;
}

export interface FinancialKPIs {
  totalRevenue: number;
  totalOperatingExpenses: number;
  operatingProfit: number;
  operatingProfitMargin: number;
  revenueYoYGrowth: number | null;
  expenseYoYGrowth: number | null;
  profitYoYGrowth: number | null;
  outstandingReceivables: number;
  recurringRevenuePercentage: number;
  grossMargin?: number;
  totalCashInflow?: number;
  totalCashOutflow?: number;
}

export interface MonthlyMetric {
  key: string; // "2024-01"
  year: number;
  month: number;
  periodLabel: string; // "Jan 24"
  revenue: number;
  expense: number;
  operatingProfit: number;
  profitMargin: number;
  recurringRevenue: number;
  nonRecurringRevenue: number;
  cashCollected: number;
  cashPaid: number;
}

export interface CategoryMetric {
  category: string;
  netAmount: number;
  percentageOfTotal: number;
  count: number;
  recurringAmount: number;
}

export interface CustomerMetric {
  customer: string;
  revenue: number;
  percentage: number;
  invoiceCount: number;
  outstanding: number;
}

export interface ScenarioLever {
  id: string;
  name: string;
  type: 'price_change' | 'customer_churn' | 'hire_staff' | 'cost_reduction' | 'marketing_boost' | 'custom';
  impactTarget: 'revenue' | 'operating_expense' | 'category';
  targetCategory?: string;
  percentageDelta?: number; // e.g. +10%
  fixedAnnualDelta?: number; // e.g. +£60,000
  effectiveFromMonth?: number; // 1-12
  enabled: boolean;
  notes: string;
}

export interface ForecastAssumptions {
  timeHorizonMonths: number; // 12 or 24
  scenarioMode: 'base' | 'bull' | 'bear';
  annualRevenueGrowthPct: number;
  annualExpenseInflationPct: number;
  plannedMonthlyNewHiresCost: number;
  subscriptionChurnRatePct: number;
  newProductExpansionMonthlyBoost: number;
}
