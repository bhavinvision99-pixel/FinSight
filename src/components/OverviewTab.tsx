import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  PiggyBank,
  Percent,
  Clock,
  Repeat,
  Info,
  Filter,
  ArrowUpRight,
} from 'lucide-react';
import { Transaction, FinancialKPIs } from '../types/financial';
import {
  calculateKPIs,
  calculateMonthlySeries,
  calculateCategoryBreakdown,
  calculateTopCustomers,
} from '../services/calculationEngine';
import { formatGBP, formatPercent } from '../utils/formatters';

interface OverviewTabProps {
  transactions: Transaction[];
  onDrilldown: (title: string, subtitle: string, txs: Transaction[]) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  transactions,
  onDrilldown,
}) => {
  // Available Years
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(transactions.map(t => t.year))).sort((a, b) => b - a);
    return years.length > 0 ? years : [2025, 2024];
  }, [transactions]);

  // Filters
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(availableYears[0] || 2025);
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCounterparty, setSelectedCounterparty] = useState<string>('all');

  // Categories & Counterparties for filter dropdowns
  const categories = useMemo(() => {
    return Array.from(new Set(transactions.map(t => t.category))).sort();
  }, [transactions]);

  const counterparties = useMemo(() => {
    return Array.from(new Set(transactions.map(t => t.counterparty))).sort();
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchYear = selectedYear === 'all' || t.year === selectedYear;
      const matchMonth = selectedMonth === 'all' || t.month === selectedMonth;
      const matchCategory = selectedCategory === 'all' || t.category === selectedCategory;
      const matchCounterparty = selectedCounterparty === 'all' || t.counterparty === selectedCounterparty;
      return matchYear && matchMonth && matchCategory && matchCounterparty;
    });
  }, [transactions, selectedYear, selectedMonth, selectedCategory, selectedCounterparty]);

  // Comparison year for YoY
  const comparisonYear = useMemo(() => {
    if (typeof selectedYear === 'number') {
      return selectedYear - 1;
    }
    return undefined;
  }, [selectedYear]);

  // KPIs
  const kpis: FinancialKPIs = useMemo(() => {
    return calculateKPIs(
      filteredTransactions,
      typeof selectedYear === 'number' ? selectedYear : undefined,
      comparisonYear
    );
  }, [filteredTransactions, selectedYear, comparisonYear]);

  // Monthly Chart Data
  const monthlyData = useMemo(() => {
    return calculateMonthlySeries(
      filteredTransactions,
      typeof selectedYear === 'number' ? selectedYear : undefined
    );
  }, [filteredTransactions, selectedYear]);

  // Category Breakdowns
  const revenueCategories = useMemo(() => {
    return calculateCategoryBreakdown(
      filteredTransactions,
      'income',
      typeof selectedYear === 'number' ? selectedYear : undefined
    );
  }, [filteredTransactions, selectedYear]);

  const expenseCategories = useMemo(() => {
    return calculateCategoryBreakdown(
      filteredTransactions,
      'expense',
      typeof selectedYear === 'number' ? selectedYear : undefined
    );
  }, [filteredTransactions, selectedYear]);

  // Top Customers
  const topCustomers = useMemo(() => {
    return calculateTopCustomers(
      filteredTransactions,
      typeof selectedYear === 'number' ? selectedYear : undefined,
      7
    );
  }, [filteredTransactions, selectedYear]);

  // Color Palette
  const TEAL = '#0D9488';
  const BLUE = '#2563EB';
  const ROSE = '#E11D48';
  const SLATE = '#64748B';

  return (
    <div className="space-y-6">
      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Filter className="w-4 h-4 text-teal-600" />
          <span>Financial Filters:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Year Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Year:</span>
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setSelectedYear('all')}
                className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                  selectedYear === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Years
              </button>
              {availableYears.map(yr => (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                    selectedYear === yr ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>

          {/* Month Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Month:</span>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">Full Year (All Months)</option>
              {[
                { v: 1, l: '01 - Jan' },
                { v: 2, l: '02 - Feb' },
                { v: 3, l: '03 - Mar' },
                { v: 4, l: '04 - Apr' },
                { v: 5, l: '05 - May' },
                { v: 6, l: '06 - Jun' },
                { v: 7, l: '07 - Jul' },
                { v: 8, l: '08 - Aug' },
                { v: 9, l: '09 - Sep' },
                { v: 10, l: '10 - Oct' },
                { v: 11, l: '11 - Nov' },
                { v: 12, l: '12 - Dec' },
              ].map(m => (
                <option key={m.v} value={m.v}>
                  {m.l}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Category:</span>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium text-xs focus:outline-none max-w-[160px] truncate cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Counterparty Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Entity:</span>
            <select
              value={selectedCounterparty}
              onChange={e => setSelectedCounterparty(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium text-xs focus:outline-none max-w-[160px] truncate cursor-pointer"
            >
              <option value="all">All Entities</option>
              {counterparties.map(cp => (
                <option key={cp} value={cp}>
                  {cp}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          {(selectedMonth !== 'all' || selectedCategory !== 'all' || selectedCounterparty !== 'all') && (
            <button
              onClick={() => {
                setSelectedMonth('all');
                setSelectedCategory('all');
                setSelectedCounterparty('all');
              }}
              className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div
          onClick={() => {
            const incomeTxs = filteredTransactions.filter(t => t.type === 'income');
            onDrilldown('Total Operating Revenue', `Net of VAT (£${kpis.totalRevenue.toLocaleString()})`, incomeTxs);
          }}
          className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-teal-500 transition-all cursor-pointer shadow-2xs group hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900 tracking-tight">{formatGBP(kpis.totalRevenue)}</div>
            {kpis.revenueYoYGrowth !== null && (
              <span
                className={`text-xs font-bold flex items-center gap-0.5 px-2 py-0.5 rounded-full ${
                  kpis.revenueYoYGrowth >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}
              >
                {kpis.revenueYoYGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {formatPercent(kpis.revenueYoYGrowth)} YoY
              </span>
            )}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Net of VAT • Accruals</span>
            <span className="text-teal-600 font-semibold group-hover:underline flex items-center gap-0.5">
              Drill-down <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Operating Expenses */}
        <div
          onClick={() => {
            const expTxs = filteredTransactions.filter(t => t.type === 'expense');
            onDrilldown('Operating Expenses', `Net of VAT (£${kpis.totalOperatingExpenses.toLocaleString()})`, expTxs);
          }}
          className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-rose-400 transition-all cursor-pointer shadow-2xs group hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Operating Expenses</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900 tracking-tight">{formatGBP(kpis.totalOperatingExpenses)}</div>
            {kpis.expenseYoYGrowth !== null && (
              <span
                className={`text-xs font-bold flex items-center gap-0.5 px-2 py-0.5 rounded-full ${
                  kpis.expenseYoYGrowth <= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}
              >
                {formatPercent(kpis.expenseYoYGrowth)} YoY
              </span>
            )}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Opex • Excludes Capex & Loans</span>
            <span className="text-rose-600 font-semibold group-hover:underline flex items-center gap-0.5">
              Drill-down <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Operating Profit */}
        <div
          onClick={() => {
            onDrilldown('Operating Profit & Loss', `Full Operating P&L Dataset`, filteredTransactions.filter(t => t.type === 'income' || t.type === 'expense'));
          }}
          className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-teal-500 transition-all cursor-pointer shadow-2xs group hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Operating Profit / Loss</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-700 group-hover:text-white transition-colors">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div
              className={`text-2xl font-black tracking-tight ${
                kpis.operatingProfit >= 0 ? 'text-teal-700' : 'text-rose-600'
              }`}
            >
              {formatGBP(kpis.operatingProfit)}
            </div>
            {kpis.profitYoYGrowth !== null && (
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  kpis.profitYoYGrowth >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}
              >
                {formatPercent(kpis.profitYoYGrowth)} YoY
              </span>
            )}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Margin: <strong className="text-slate-800">{kpis.operatingProfitMargin}%</strong></span>
            <span className="text-teal-600 font-semibold group-hover:underline flex items-center gap-0.5">
              Drill-down <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Outstanding Receivables / Unpaid */}
        <div
          onClick={() => {
            const unpaidTxs = filteredTransactions.filter(t => t.type === 'income' && (t.status === 'unpaid' || t.status === 'overdue'));
            onDrilldown('Outstanding Receivables', `Unpaid customer invoices (£${kpis.outstandingReceivables.toLocaleString()})`, unpaidTxs);
          }}
          className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-amber-400 transition-all cursor-pointer shadow-2xs group hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unpaid Receivables</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-black text-amber-700 tracking-tight">
              {formatGBP(kpis.outstandingReceivables)}
            </div>
            <span className="text-xs font-semibold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
              Pending Cash
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Awaiting Customer Settlement</span>
            <span className="text-amber-700 font-semibold group-hover:underline flex items-center gap-0.5">
              Inspect Invoices <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Accounting Notice on Cash Balance */}
      <div className="p-3.5 bg-sky-50/70 border border-sky-200/80 rounded-xl flex items-start gap-3 text-xs text-sky-900">
        <Info className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Accounting Standard Compliance Notice:</span> Operating profit reflects accrued revenue and expenses according to UK GAAP. As required, FinSight distinguishes booked invoices from cash collections. Definitive cash balances require an opening bank reconciliation and are never estimated without verified bank feeds.
        </div>
      </div>

      {/* Primary Financial Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Monthly Revenue vs Expenses */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Monthly Revenue vs. Operating Expenses</h3>
              <p className="text-xs text-slate-500 mt-0.5">Click any bar segment to inspect underlying transactions</p>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              Net of VAT
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    const item = e.activePayload[0].payload;
                    const monthTxs = filteredTransactions.filter(
                      t => t.year === item.year && t.month === item.month
                    );
                    onDrilldown(`${item.periodLabel} Ledger`, `All transactions in ${item.periodLabel}`, monthTxs);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="periodLabel" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickFormatter={val => `£${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(val: any) => [formatGBP(val), '']}
                  labelStyle={{ fontWeight: 'bold', color: '#0F172A' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="revenue" name="Revenue (£)" fill={TEAL} radius={[4, 4, 0, 0]} cursor="pointer" />
                <Bar dataKey="expense" name="Operating Expenses (£)" fill={ROSE} radius={[4, 4, 0, 0]} cursor="pointer" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Monthly Operating Profit & Profit Margin */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Operating Profit & Margin Trajectory</h3>
              <p className="text-xs text-slate-500 mt-0.5">Trend of net monthly margin (%) and operating profit (£)</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
              <Percent className="w-3 h-3" /> Margin Trend
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    const item = e.activePayload[0].payload;
                    const monthTxs = filteredTransactions.filter(
                      t => t.year === item.year && t.month === item.month
                    );
                    onDrilldown(`${item.periodLabel} Profit Audit`, `Operating profit of ${formatGBP(item.operatingProfit)}`, monthTxs);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="periodLabel" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickFormatter={val => `£${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickFormatter={val => `${val}%`}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    name === 'Operating Margin (%)' ? `${val}%` : formatGBP(val),
                    name,
                  ]}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="operatingProfit"
                  name="Operating Profit (£)"
                  stroke={TEAL}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: TEAL }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="profitMargin"
                  name="Operating Margin (%)"
                  stroke={BLUE}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: BLUE }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Charts: Category Breakdown & Top Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by Category */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Operating Expenses by Category</h3>
              <p className="text-xs text-slate-500">Click any category bar to inspect supporting vouchers</p>
            </div>
            <span className="text-xs text-slate-500 font-medium">{expenseCategories.length} Categories</span>
          </div>

          <div className="space-y-3 mt-4">
            {expenseCategories.map(cat => (
              <div
                key={cat.category}
                onClick={() => {
                  const catTxs = filteredTransactions.filter(t => t.category === cat.category);
                  onDrilldown(cat.category, `All expense records in ${cat.category}`, catTxs);
                }}
                className="group p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 group-hover:text-rose-600 transition-colors">
                      {cat.category}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">({cat.count} txs)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-900">{formatGBP(cat.netAmount)}</span>
                    <span className="text-[11px] font-semibold text-slate-500 w-12 text-right">
                      {cat.percentageOfTotal}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(cat.percentageOfTotal, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers by Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Top Customers by Revenue</h3>
              <p className="text-xs text-slate-500">B2B SaaS customer concentration and billing status</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-full">
              <Repeat className="w-3 h-3" /> {kpis.recurringRevenuePercentage}% Recurring
            </div>
          </div>

          <div className="space-y-3 mt-4">
            {topCustomers.map(cust => (
              <div
                key={cust.customer}
                onClick={() => {
                  const custTxs = filteredTransactions.filter(t => t.counterparty === cust.customer);
                  onDrilldown(cust.customer, `Invoices and payments for ${cust.customer}`, custTxs);
                }}
                className="group p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 group-hover:text-teal-600 transition-colors truncate max-w-[200px]">
                      {cust.customer}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">({cust.invoiceCount} invoices)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-900">{formatGBP(cust.revenue)}</span>
                    <span className="text-[11px] font-semibold text-slate-500 w-12 text-right">
                      {cust.percentage}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-teal-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(cust.percentage * 2.5, 100)}%` }}
                  />
                </div>

                {cust.outstanding > 0 && (
                  <div className="flex justify-end mt-1 text-[10px] text-amber-600 font-semibold">
                    Outstanding: {formatGBP(cust.outstanding)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
