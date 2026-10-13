import { Transaction, FinancialKPIs, MonthlyMetric, CategoryMetric, CustomerMetric, ReconciliationSummary, ScenarioLever, ForecastAssumptions } from '../types/financial';

/**
 * Deterministic Financial Calculation Engine
 * Adheres strictly to UK GAAP / accrual accounting principles:
 * - Uses Net amounts for P&L calculations.
 * - Separates operating items from financing/equity/transfers.
 * - Distinguishes booked revenue (invoices) from cash collected.
 * - Never hallucinates or invents figures.
 */

export function calculateReconciliationSummary(transactions: Transaction[]): ReconciliationSummary {
  let validRecords = 0;
  let warningsCount = 0;
  let totalOperatingRevenueNet = 0;
  let totalOperatingExpenseNet = 0;
  let totalVatCollected = 0;
  let totalVatPaid = 0;
  let unpaidInvoicesCount = 0;
  let unpaidInvoicesNet = 0;
  let nonOperatingIncome = 0;
  let nonOperatingTransfers = 0;
  const yearsSet = new Set<number>();
  let earliestDate = '9999-99-99';
  let latestDate = '0000-00-00';

  transactions.forEach(t => {
    if (t.validationWarnings && t.validationWarnings.length > 0) {
      warningsCount += t.validationWarnings.length;
    } else {
      validRecords++;
    }

    if (t.year) yearsSet.add(t.year);
    if (t.date < earliestDate) earliestDate = t.date;
    if (t.date > latestDate) latestDate = t.date;

    // Operating vs Non-operating separation
    if (t.type === 'income') {
      totalOperatingRevenueNet += t.netAmount;
      totalVatCollected += t.vatAmount;
      if (t.status === 'unpaid' || t.status === 'overdue') {
        unpaidInvoicesCount++;
        unpaidInvoicesNet += t.netAmount;
      }
    } else if (t.type === 'expense') {
      totalOperatingExpenseNet += t.netAmount;
      totalVatPaid += t.vatAmount;
    } else if (t.type === 'loan' || t.type === 'equity') {
      nonOperatingIncome += t.netAmount;
    } else if (t.type === 'transfer') {
      nonOperatingTransfers += t.netAmount;
    }
  });

  const operatingProfitNet = totalOperatingRevenueNet - totalOperatingExpenseNet;
  const netVatPayable = totalVatCollected - totalVatPaid;
  const yearsCovered = Array.from(yearsSet).sort((a, b) => a - b);

  return {
    totalRecords: transactions.length,
    validRecords,
    warningsCount,
    totalOperatingRevenueNet: Math.round(totalOperatingRevenueNet * 100) / 100,
    totalOperatingExpenseNet: Math.round(totalOperatingExpenseNet * 100) / 100,
    operatingProfitNet: Math.round(operatingProfitNet * 100) / 100,
    totalVatCollected: Math.round(totalVatCollected * 100) / 100,
    totalVatPaid: Math.round(totalVatPaid * 100) / 100,
    netVatPayable: Math.round(netVatPayable * 100) / 100,
    unpaidInvoicesCount,
    unpaidInvoicesNet: Math.round(unpaidInvoicesNet * 100) / 100,
    nonOperatingIncome: Math.round(nonOperatingIncome * 100) / 100,
    nonOperatingTransfers: Math.round(nonOperatingTransfers * 100) / 100,
    yearsCovered,
    earliestDate: earliestDate === '9999-99-99' ? '-' : earliestDate,
    latestDate: latestDate === '0000-00-00' ? '-' : latestDate,
  };
}

export function calculateKPIs(
  transactions: Transaction[],
  selectedYear?: number,
  comparisonYear?: number
): FinancialKPIs {
  // Filter for selected year if given
  const currentTxs = selectedYear
    ? transactions.filter(t => t.year === selectedYear)
    : transactions;

  let totalRevenue = 0;
  let totalOperatingExpenses = 0;
  let recurringRevenue = 0;
  let outstandingReceivables = 0;
  let totalCashInflow = 0;
  let totalCashOutflow = 0;

  currentTxs.forEach(t => {
    if (t.type === 'income') {
      totalRevenue += t.netAmount;
      if (t.isRecurring) recurringRevenue += t.netAmount;
      if (t.status === 'unpaid' || t.status === 'overdue') {
        outstandingReceivables += t.netAmount;
      }
      if (t.status === 'paid') {
        totalCashInflow += t.grossAmount;
      }
    } else if (t.type === 'expense') {
      totalOperatingExpenses += t.netAmount;
      if (t.status === 'paid') {
        totalCashOutflow += t.grossAmount;
      }
    }
  });

  const operatingProfit = totalRevenue - totalOperatingExpenses;
  const operatingProfitMargin = totalRevenue > 0 ? (operatingProfit / totalRevenue) * 100 : 0;
  const recurringRevenuePercentage = totalRevenue > 0 ? (recurringRevenue / totalRevenue) * 100 : 0;

  // Comparison metrics for YoY
  let revenueYoYGrowth: number | null = null;
  let expenseYoYGrowth: number | null = null;
  let profitYoYGrowth: number | null = null;

  if (selectedYear && comparisonYear) {
    const prevTxs = transactions.filter(t => t.year === comparisonYear);
    const prevRev = prevTxs
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.netAmount, 0);
    const prevExp = prevTxs
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.netAmount, 0);
    const prevProfit = prevRev - prevExp;

    if (prevRev > 0) {
      revenueYoYGrowth = ((totalRevenue - prevRev) / prevRev) * 100;
    }
    if (prevExp > 0) {
      expenseYoYGrowth = ((totalOperatingExpenses - prevExp) / prevExp) * 100;
    }
    if (Math.abs(prevProfit) > 0) {
      profitYoYGrowth = ((operatingProfit - prevProfit) / Math.abs(prevProfit)) * 100;
    }
  }

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalOperatingExpenses: Math.round(totalOperatingExpenses * 100) / 100,
    operatingProfit: Math.round(operatingProfit * 100) / 100,
    operatingProfitMargin: Math.round(operatingProfitMargin * 10) / 10,
    revenueYoYGrowth: revenueYoYGrowth !== null ? Math.round(revenueYoYGrowth * 10) / 10 : null,
    expenseYoYGrowth: expenseYoYGrowth !== null ? Math.round(expenseYoYGrowth * 10) / 10 : null,
    profitYoYGrowth: profitYoYGrowth !== null ? Math.round(profitYoYGrowth * 10) / 10 : null,
    outstandingReceivables: Math.round(outstandingReceivables * 100) / 100,
    recurringRevenuePercentage: Math.round(recurringRevenuePercentage * 10) / 10,
    totalCashInflow: Math.round(totalCashInflow * 100) / 100,
    totalCashOutflow: Math.round(totalCashOutflow * 100) / 100,
  };
}

export function calculateMonthlySeries(
  transactions: Transaction[],
  yearFilter?: number
): MonthlyMetric[] {
  const monthMap: Record<string, MonthlyMetric> = {};
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Filter transactions
  const txs = yearFilter ? transactions.filter(t => t.year === yearFilter) : transactions;

  txs.forEach(t => {
    const key = `${t.year}-${t.month < 10 ? '0' : ''}${t.month}`;
    if (!monthMap[key]) {
      const shortYear = t.year.toString().slice(2);
      monthMap[key] = {
        key,
        year: t.year,
        month: t.month,
        periodLabel: `${monthNames[t.month - 1]} '${shortYear}`,
        revenue: 0,
        expense: 0,
        operatingProfit: 0,
        profitMargin: 0,
        recurringRevenue: 0,
        nonRecurringRevenue: 0,
        cashCollected: 0,
        cashPaid: 0,
      };
    }

    if (t.type === 'income') {
      monthMap[key].revenue += t.netAmount;
      if (t.isRecurring) {
        monthMap[key].recurringRevenue += t.netAmount;
      } else {
        monthMap[key].nonRecurringRevenue += t.netAmount;
      }
      if (t.status === 'paid') {
        monthMap[key].cashCollected += t.grossAmount;
      }
    } else if (t.type === 'expense') {
      monthMap[key].expense += t.netAmount;
      if (t.status === 'paid') {
        monthMap[key].cashPaid += t.grossAmount;
      }
    }
  });

  const sortedList = Object.values(monthMap).sort((a, b) => a.key.localeCompare(b.key));

  return sortedList.map(m => {
    const operatingProfit = Math.round((m.revenue - m.expense) * 100) / 100;
    const profitMargin = m.revenue > 0 ? Math.round(((operatingProfit / m.revenue) * 100) * 10) / 10 : 0;
    return {
      ...m,
      revenue: Math.round(m.revenue * 100) / 100,
      expense: Math.round(m.expense * 100) / 100,
      operatingProfit,
      profitMargin,
      recurringRevenue: Math.round(m.recurringRevenue * 100) / 100,
      nonRecurringRevenue: Math.round(m.nonRecurringRevenue * 100) / 100,
      cashCollected: Math.round(m.cashCollected * 100) / 100,
      cashPaid: Math.round(m.cashPaid * 100) / 100,
    };
  });
}

export function calculateCategoryBreakdown(
  transactions: Transaction[],
  type: 'income' | 'expense',
  yearFilter?: number
): CategoryMetric[] {
  const txs = transactions.filter(t => t.type === type && (!yearFilter || t.year === yearFilter));
  const categoryMap: Record<string, { netAmount: number; count: number; recurringAmount: number }> = {};
  let totalSum = 0;

  txs.forEach(t => {
    totalSum += t.netAmount;
    if (!categoryMap[t.category]) {
      categoryMap[t.category] = { netAmount: 0, count: 0, recurringAmount: 0 };
    }
    categoryMap[t.category].netAmount += t.netAmount;
    categoryMap[t.category].count += 1;
    if (t.isRecurring) {
      categoryMap[t.category].recurringAmount += t.netAmount;
    }
  });

  return Object.entries(categoryMap)
    .map(([category, val]) => ({
      category,
      netAmount: Math.round(val.netAmount * 100) / 100,
      percentageOfTotal: totalSum > 0 ? Math.round((val.netAmount / totalSum) * 1000) / 10 : 0,
      count: val.count,
      recurringAmount: Math.round(val.recurringAmount * 100) / 100,
    }))
    .sort((a, b) => b.netAmount - a.netAmount);
}

export function calculateTopCustomers(
  transactions: Transaction[],
  yearFilter?: number,
  limit = 10
): CustomerMetric[] {
  const txs = transactions.filter(t => t.type === 'income' && (!yearFilter || t.year === yearFilter));
  const customerMap: Record<string, { revenue: number; invoiceCount: number; outstanding: number }> = {};
  let totalRevenue = 0;

  txs.forEach(t => {
    totalRevenue += t.netAmount;
    if (!customerMap[t.counterparty]) {
      customerMap[t.counterparty] = { revenue: 0, invoiceCount: 0, outstanding: 0 };
    }
    customerMap[t.counterparty].revenue += t.netAmount;
    customerMap[t.counterparty].invoiceCount += 1;
    if (t.status === 'unpaid' || t.status === 'overdue') {
      customerMap[t.counterparty].outstanding += t.netAmount;
    }
  });

  return Object.entries(customerMap)
    .map(([customer, val]) => ({
      customer,
      revenue: Math.round(val.revenue * 100) / 100,
      percentage: totalRevenue > 0 ? Math.round((val.revenue / totalRevenue) * 1000) / 10 : 0,
      invoiceCount: val.invoiceCount,
      outstanding: Math.round(val.outstanding * 100) / 100,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export function calculateYoYComparison(
  transactions: Transaction[],
  years: [number, number]
) {
  const [year1, year2] = years;
  const kpi1 = calculateKPIs(transactions, year1);
  const kpi2 = calculateKPIs(transactions, year2, year1);

  const categories = Array.from(new Set(transactions.map(t => t.category)));
  const categoryDeltas = categories.map(cat => {
    const net1 = transactions
      .filter(t => t.year === year1 && t.category === cat)
      .reduce((s, t) => s + t.netAmount, 0);
    const net2 = transactions
      .filter(t => t.year === year2 && t.category === cat)
      .reduce((s, t) => s + t.netAmount, 0);
    const delta = net2 - net1;
    const pct = net1 > 0 ? ((delta / net1) * 100) : null;
    return {
      category: cat,
      year1Amount: Math.round(net1 * 100) / 100,
      year2Amount: Math.round(net2 * 100) / 100,
      delta: Math.round(delta * 100) / 100,
      deltaPercent: pct !== null ? Math.round(pct * 10) / 10 : null,
    };
  }).filter(c => c.year1Amount > 0 || c.year2Amount > 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  return {
    year1: { year: year1, kpi: kpi1 },
    year2: { year: year2, kpi: kpi2 },
    categoryDeltas,
  };
}

/**
 * Scenario Simulator Engine
 * Calculates side-by-side financial variances when levers are engaged
 */
export function simulateScenario(
  baseTransactions: Transaction[],
  targetYear: number,
  levers: ScenarioLever[]
) {
  const activeLevers = levers.filter(l => l.enabled);
  const baseTxs = baseTransactions.filter(t => t.year === targetYear);
  const baseKPIs = calculateKPIs(baseTransactions, targetYear);

  let simulatedRevenue = baseKPIs.totalRevenue;
  let simulatedExpenses = baseKPIs.totalOperatingExpenses;

  // Breakdown of category shifts
  const leverImpactSummaries: { leverId: string; name: string; revenueImpact: number; expenseImpact: number; netProfitImpact: number }[] = [];

  activeLevers.forEach(lever => {
    let revImpact = 0;
    let expImpact = 0;

    const leverNameLower = lever.name.toLowerCase();
    const isHireOrStaff =
      lever.type === 'hire_staff' ||
      leverNameLower.includes('employee') ||
      leverNameLower.includes('hire') ||
      leverNameLower.includes('staff') ||
      leverNameLower.includes('headcount') ||
      leverNameLower.includes('engineer') ||
      leverNameLower.includes('payroll') ||
      leverNameLower.includes('salary');

    const isKnownExpenseCategory =
      lever.targetCategory === 'Salaries & Payroll' ||
      lever.targetCategory === 'Cloud Hosting' ||
      lever.targetCategory === 'Marketing & Ads' ||
      lever.targetCategory === 'Office & Facilities' ||
      lever.targetCategory === 'Software Licences' ||
      lever.targetCategory === 'Legal & Accounting' ||
      lever.targetCategory === 'Hardware & Equipment';

    if (isHireOrStaff) {
      // Adding staff or hiring employees is strictly an operating cost increase!
      const delta = lever.fixedAnnualDelta !== undefined
        ? lever.fixedAnnualDelta
        : (lever.percentageDelta ? (baseKPIs.totalOperatingExpenses * lever.percentageDelta) / 100 : 0);
      expImpact += Math.abs(delta);
    } else if (lever.impactTarget === 'category' && lever.targetCategory) {
      const catBaseAmount = baseTxs
        .filter(t => t.category.toLowerCase() === lever.targetCategory!.toLowerCase())
        .reduce((s, t) => s + t.netAmount, 0);

      const isExpenseCat =
        isKnownExpenseCategory ||
        baseTxs.some(t => t.category.toLowerCase() === lever.targetCategory!.toLowerCase() && t.type === 'expense');

      const delta = lever.percentageDelta !== undefined
        ? (catBaseAmount * lever.percentageDelta) / 100
        : (lever.fixedAnnualDelta || 0);

      if (isExpenseCat) {
        expImpact += delta;
      } else {
        revImpact += delta;
      }
    } else if (lever.impactTarget === 'operating_expense' || isKnownExpenseCategory) {
      if (lever.percentageDelta) {
        expImpact += (baseKPIs.totalOperatingExpenses * lever.percentageDelta) / 100;
      }
      if (lever.fixedAnnualDelta) {
        expImpact += lever.fixedAnnualDelta;
      }
    } else if (lever.impactTarget === 'revenue') {
      if (lever.percentageDelta) {
        revImpact += (baseKPIs.totalRevenue * lever.percentageDelta) / 100;
      }
      if (lever.fixedAnnualDelta) {
        revImpact += lever.fixedAnnualDelta;
      }
    }

    simulatedRevenue += revImpact;
    simulatedExpenses += expImpact;

    leverImpactSummaries.push({
      leverId: lever.id,
      name: lever.name,
      revenueImpact: Math.round(revImpact * 100) / 100,
      expenseImpact: Math.round(expImpact * 100) / 100,
      netProfitImpact: Math.round((revImpact - expImpact) * 100) / 100,
    });
  });

  const simulatedOperatingProfit = simulatedRevenue - simulatedExpenses;
  const simulatedMargin = simulatedRevenue > 0 ? (simulatedOperatingProfit / simulatedRevenue) * 100 : 0;

  // Variance calculations
  const varianceRevenue = simulatedRevenue - baseKPIs.totalRevenue;
  const varianceExpense = simulatedExpenses - baseKPIs.totalOperatingExpenses;
  const varianceProfit = simulatedOperatingProfit - baseKPIs.operatingProfit;
  const varianceMargin = simulatedMargin - baseKPIs.operatingProfitMargin;

  // Monthly simulated curve based on base seasonality
  const baseMonthly = calculateMonthlySeries(baseTransactions, targetYear);
  const simulatedMonthly = baseMonthly.map(m => {
    const revRatio = baseKPIs.totalRevenue > 0 ? m.revenue / baseKPIs.totalRevenue : 1 / 12;
    const expRatio = baseKPIs.totalOperatingExpenses > 0 ? m.expense / baseKPIs.totalOperatingExpenses : 1 / 12;

    const mSimRev = Math.round(simulatedRevenue * revRatio * 100) / 100;
    const mSimExp = Math.round(simulatedExpenses * expRatio * 100) / 100;
    const mSimProfit = Math.round((mSimRev - mSimExp) * 100) / 100;

    return {
      periodLabel: m.periodLabel,
      baseRevenue: m.revenue,
      baseExpense: m.expense,
      baseProfit: m.operatingProfit,
      simulatedRevenue: mSimRev,
      simulatedExpense: mSimExp,
      simulatedProfit: mSimProfit,
    };
  });

  return {
    baseKPIs,
    simulatedKPIs: {
      totalRevenue: Math.round(simulatedRevenue * 100) / 100,
      totalOperatingExpenses: Math.round(simulatedExpenses * 100) / 100,
      operatingProfit: Math.round(simulatedOperatingProfit * 100) / 100,
      operatingProfitMargin: Math.round(simulatedMargin * 10) / 10,
    },
    variances: {
      revenue: Math.round(varianceRevenue * 100) / 100,
      revenuePct: baseKPIs.totalRevenue > 0 ? Math.round((varianceRevenue / baseKPIs.totalRevenue) * 1000) / 10 : 0,
      expense: Math.round(varianceExpense * 100) / 100,
      expensePct: baseKPIs.totalOperatingExpenses > 0 ? Math.round((varianceExpense / baseKPIs.totalOperatingExpenses) * 1000) / 10 : 0,
      profit: Math.round(varianceProfit * 100) / 100,
      marginDeltaPct: Math.round(varianceMargin * 10) / 10,
    },
    leverImpactSummaries,
    simulatedMonthly,
  };
}

/**
 * Forward-looking Financial Forecast Engine
 */
export function generateForecast(
  transactions: Transaction[],
  assumptions: ForecastAssumptions
) {
  // Use latest available year as baseline run-rate
  const years = Array.from(new Set(transactions.map(t => t.year))).sort((a, b) => b - a);
  const baselineYear = years[0] || 2025;
  const baseMonthly = calculateMonthlySeries(transactions, baselineYear);

  if (baseMonthly.length === 0) return [];

  // Average monthly base revenue and expense from second half of the year
  const recentMonths = baseMonthly.slice(-6);
  const avgMonthlyRev = recentMonths.reduce((s, m) => s + m.revenue, 0) / recentMonths.length;
  const avgMonthlyExp = recentMonths.reduce((s, m) => s + m.expense, 0) / recentMonths.length;

  let multiplierGrowth = assumptions.annualRevenueGrowthPct / 100;
  let multiplierInflation = assumptions.annualExpenseInflationPct / 100;

  if (assumptions.scenarioMode === 'bull') {
    multiplierGrowth *= 1.35;
    multiplierInflation *= 0.85;
  } else if (assumptions.scenarioMode === 'bear') {
    multiplierGrowth *= 0.55;
    multiplierInflation *= 1.25;
  }

  const monthlyGrowthRate = Math.pow(1 + multiplierGrowth, 1 / 12) - 1;
  const monthlyInflationRate = Math.pow(1 + multiplierInflation, 1 / 12) - 1;

  const forecastPoints: {
    monthIndex: number;
    periodLabel: string;
    projectedRevenue: number;
    projectedExpense: number;
    projectedOperatingProfit: number;
    projectedMargin: number;
    cumulativeCashflow: number;
  }[] = [];

  let currentRev = avgMonthlyRev;
  let currentExp = avgMonthlyExp;
  let cumulativeCash = 0;

  const nextYear = baselineYear + 1;
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (let i = 1; i <= assumptions.timeHorizonMonths; i++) {
    const yearOffset = Math.floor((i - 1) / 12);
    const mIdx = (i - 1) % 12;
    const label = `${monthNames[mIdx]} '${(nextYear + yearOffset).toString().slice(2)}`;

    // Compound revenue with monthly organic growth + expansion boost - churn
    const netGrowth = monthlyGrowthRate - (assumptions.subscriptionChurnRatePct / 100 / 12);
    currentRev = currentRev * (1 + netGrowth) + assumptions.newProductExpansionMonthlyBoost;

    // Compound expense with inflation + new hires
    currentExp = currentExp * (1 + monthlyInflationRate) + assumptions.plannedMonthlyNewHiresCost;

    const opProfit = currentRev - currentExp;
    cumulativeCash += opProfit;

    forecastPoints.push({
      monthIndex: i,
      periodLabel: label,
      projectedRevenue: Math.round(currentRev * 100) / 100,
      projectedExpense: Math.round(currentExp * 100) / 100,
      projectedOperatingProfit: Math.round(opProfit * 100) / 100,
      projectedMargin: Math.round((opProfit / currentRev) * 1000) / 10,
      cumulativeCashflow: Math.round(cumulativeCash * 100) / 100,
    });
  }

  return forecastPoints;
}
