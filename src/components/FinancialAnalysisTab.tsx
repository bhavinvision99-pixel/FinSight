import React, { useState, useMemo } from 'react';
import { Transaction } from '../types/financial';
import { calculateKPIs, calculateCategoryBreakdown, calculateTopCustomers } from '../services/calculationEngine';
import { formatGBPExact, formatGBP, formatPercent } from '../utils/formatters';
import {
  FileText,
  PieChart as PieIcon,
  Percent,
  Users,
  ShieldCheck,
  ArrowUpRight,
  HelpCircle,
} from 'lucide-react';

interface FinancialAnalysisTabProps {
  transactions: Transaction[];
  onDrilldown: (title: string, subtitle: string, txs: Transaction[]) => void;
}

export const FinancialAnalysisTab: React.FC<FinancialAnalysisTabProps> = ({
  transactions,
  onDrilldown,
}) => {
  const years = useMemo(() => {
    return Array.from(new Set(transactions.map(t => t.year))).sort((a, b) => b - a);
  }, [transactions]);

  const [selectedYear, setSelectedYear] = useState<number>(years[0] || 2025);

  const yearTxs = useMemo(() => {
    return transactions.filter(t => t.year === selectedYear);
  }, [transactions, selectedYear]);

  // Previous year for comparative column
  const prevYear = selectedYear - 1;
  const prevYearTxs = useMemo(() => {
    return transactions.filter(t => t.year === prevYear);
  }, [transactions, prevYear]);

  // Revenue categories
  const revCatsCurrent = useMemo(() => calculateCategoryBreakdown(yearTxs, 'income'), [yearTxs]);
  const revCatsPrev = useMemo(() => calculateCategoryBreakdown(prevYearTxs, 'income'), [prevYearTxs]);

  // Expense categories
  const expCatsCurrent = useMemo(() => calculateCategoryBreakdown(yearTxs, 'expense'), [yearTxs]);
  const expCatsPrev = useMemo(() => calculateCategoryBreakdown(prevYearTxs, 'expense'), [prevYearTxs]);

  // KPIs
  const kpisCurrent = useMemo(() => calculateKPIs(transactions, selectedYear, prevYear), [transactions, selectedYear, prevYear]);
  const kpisPrev = useMemo(() => calculateKPIs(transactions, prevYear), [transactions, prevYear]);

  // Customer Concentration
  const topClients = useMemo(() => calculateTopCustomers(yearTxs, selectedYear, 10), [yearTxs, selectedYear]);

  // Non-operating transactions
  const nonOperatingTxs = useMemo(() => {
    return yearTxs.filter(t => t.type === 'loan' || t.type === 'equity' || t.type === 'transfer');
  }, [yearTxs]);

  const nonOperatingSum = useMemo(() => {
    return nonOperatingTxs.reduce((s, t) => s + t.netAmount, 0);
  }, [nonOperatingTxs]);

  return (
    <div className="space-y-6">
      {/* Year Switcher Header */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Profit & Loss and Operational Economics</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Accruals-based financial performance with UK GAAP Net/VAT segregation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Financial Year:</span>
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {years.map(yr => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  selectedYear === yr
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                FY {yr}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* P&L Statement Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-100 text-teal-800 rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Management Profit & Loss Statement</h3>
              <p className="text-[11px] text-slate-500">All figures expressed net of VAT in GBP (£)</p>
            </div>
          </div>

          <span className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-full">
            Comparative View: FY {selectedYear} vs FY {prevYear}
          </span>
        </div>

        {/* Statement Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-6">Account / Category</th>
                <th className="py-3 px-4 text-right">FY {selectedYear} (Net)</th>
                <th className="py-3 px-4 text-right">% Revenue</th>
                <th className="py-3 px-4 text-right">FY {prevYear} (Net)</th>
                <th className="py-3 px-4 text-right">Variance (£)</th>
                <th className="py-3 px-4 text-right">YoY (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {/* REVENUE SECTION */}
              <tr className="bg-slate-50/40 font-bold text-slate-900">
                <td colSpan={6} className="py-2.5 px-6 text-teal-800 uppercase tracking-wider text-[11px]">
                  Operating Revenue
                </td>
              </tr>
              {revCatsCurrent.map(cat => {
                const prevCat = revCatsPrev.find(c => c.category === cat.category);
                const prevAmt = prevCat ? prevCat.netAmount : 0;
                const delta = cat.netAmount - prevAmt;
                const pct = prevAmt > 0 ? (delta / prevAmt) * 100 : null;

                return (
                  <tr
                    key={cat.category}
                    onClick={() => {
                      const txs = yearTxs.filter(t => t.category === cat.category);
                      onDrilldown(cat.category, `FY ${selectedYear} revenue ledger`, txs);
                    }}
                    className="hover:bg-teal-50/30 transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 px-6 pl-10 flex items-center gap-1.5 font-medium text-slate-900 group-hover:text-teal-700">
                      <span>{cat.category}</span>
                      <ArrowUpRight className="w-3 h-3 text-slate-300 group-hover:text-teal-600" />
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold">{formatGBPExact(cat.netAmount)}</td>
                    <td className="py-2.5 px-4 text-right text-slate-500">{cat.percentageOfTotal}%</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-500">{formatGBPExact(prevAmt)}</td>
                    <td className={`py-2.5 px-4 text-right font-mono ${delta >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {delta >= 0 ? `+${formatGBPExact(delta)}` : formatGBPExact(delta)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold">{formatPercent(pct)}</td>
                  </tr>
                );
              })}

              {/* TOTAL REVENUE ROW */}
              <tr className="bg-teal-50/50 font-bold text-slate-900 border-t-2 border-b-2 border-teal-200">
                <td className="py-3 px-6">Total Operating Revenue</td>
                <td className="py-3 px-4 text-right font-mono text-teal-800">{formatGBPExact(kpisCurrent.totalRevenue)}</td>
                <td className="py-3 px-4 text-right">100.0%</td>
                <td className="py-3 px-4 text-right font-mono text-slate-600">{formatGBPExact(kpisPrev.totalRevenue)}</td>
                <td className="py-3 px-4 text-right font-mono text-teal-800">
                  {formatGBPExact(kpisCurrent.totalRevenue - kpisPrev.totalRevenue)}
                </td>
                <td className="py-3 px-4 text-right text-teal-800">{formatPercent(kpisCurrent.revenueYoYGrowth)}</td>
              </tr>

              {/* OPERATING EXPENSES SECTION */}
              <tr className="bg-slate-50/40 font-bold text-slate-900">
                <td colSpan={6} className="py-2.5 px-6 text-rose-800 uppercase tracking-wider text-[11px]">
                  Operating Expenses
                </td>
              </tr>
              {expCatsCurrent.map(cat => {
                const prevCat = expCatsPrev.find(c => c.category === cat.category);
                const prevAmt = prevCat ? prevCat.netAmount : 0;
                const delta = cat.netAmount - prevAmt;
                const pct = prevAmt > 0 ? (delta / prevAmt) * 100 : null;

                return (
                  <tr
                    key={cat.category}
                    onClick={() => {
                      const txs = yearTxs.filter(t => t.category === cat.category);
                      onDrilldown(cat.category, `FY ${selectedYear} expense ledger`, txs);
                    }}
                    className="hover:bg-rose-50/30 transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 px-6 pl-10 flex items-center gap-1.5 font-medium text-slate-900 group-hover:text-rose-600">
                      <span>{cat.category}</span>
                      <ArrowUpRight className="w-3 h-3 text-slate-300 group-hover:text-rose-600" />
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold">{formatGBPExact(cat.netAmount)}</td>
                    <td className="py-2.5 px-4 text-right text-slate-500">
                      {kpisCurrent.totalRevenue > 0
                        ? `${((cat.netAmount / kpisCurrent.totalRevenue) * 100).toFixed(1)}%`
                        : '0.0%'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-500">{formatGBPExact(prevAmt)}</td>
                    <td className={`py-2.5 px-4 text-right font-mono ${delta > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {delta >= 0 ? `+${formatGBPExact(delta)}` : formatGBPExact(delta)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold">{formatPercent(pct)}</td>
                  </tr>
                );
              })}

              {/* TOTAL OPERATING EXPENSES ROW */}
              <tr className="bg-rose-50/50 font-bold text-slate-900 border-t-2 border-b-2 border-rose-200">
                <td className="py-3 px-6">Total Operating Expenses</td>
                <td className="py-3 px-4 text-right font-mono text-rose-800">{formatGBPExact(kpisCurrent.totalOperatingExpenses)}</td>
                <td className="py-3 px-4 text-right">
                  {kpisCurrent.totalRevenue > 0
                    ? `${((kpisCurrent.totalOperatingExpenses / kpisCurrent.totalRevenue) * 100).toFixed(1)}%`
                    : '0.0%'}
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-600">{formatGBPExact(kpisPrev.totalOperatingExpenses)}</td>
                <td className="py-3 px-4 text-right font-mono text-rose-800">
                  {formatGBPExact(kpisCurrent.totalOperatingExpenses - kpisPrev.totalOperatingExpenses)}
                </td>
                <td className="py-3 px-4 text-right text-rose-800">{formatPercent(kpisCurrent.expenseYoYGrowth)}</td>
              </tr>

              {/* NET OPERATING PROFIT ROW */}
              <tr className="bg-slate-900 text-white font-extrabold text-sm">
                <td className="py-4 px-6">Operating Profit / (Loss)</td>
                <td className="py-4 px-4 text-right font-mono text-teal-300">{formatGBPExact(kpisCurrent.operatingProfit)}</td>
                <td className="py-4 px-4 text-right text-teal-400">{kpisCurrent.operatingProfitMargin}%</td>
                <td className="py-4 px-4 text-right font-mono text-slate-300">{formatGBPExact(kpisPrev.operatingProfit)}</td>
                <td className="py-4 px-4 text-right font-mono text-teal-300">
                  {formatGBPExact(kpisCurrent.operatingProfit - kpisPrev.operatingProfit)}
                </td>
                <td className="py-4 px-4 text-right text-teal-300">{formatPercent(kpisCurrent.profitYoYGrowth)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Non-Operating Capital & Segregation Section */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Non-Operating Transactions & Balance Sheet Capital ({selectedYear})
            </h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
            Excluded from P&L Accruals
          </span>
        </div>

        <p className="text-xs text-slate-500">
          Strict accounting rules dictate separating operating income (customer SaaS subscriptions) from term loans and equity capital. Below are non-operating movements detected in FY {selectedYear}:
        </p>

        {nonOperatingTxs.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
            No non-operating loans or equity injections recorded for FY {selectedYear}.
          </div>
        ) : (
          <div className="space-y-2">
            {nonOperatingTxs.map(t => (
              <div
                key={t.id}
                onClick={() => onDrilldown(t.description, `Non-operating transaction ${t.id}`, [t])}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div>
                  <div className="font-bold text-slate-900">{t.description}</div>
                  <div className="text-[11px] text-slate-500">
                    Source: {t.counterparty} • Type: <span className="uppercase font-semibold text-teal-700">{t.type}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-slate-900">{formatGBPExact(t.netAmount)}</div>
                  <span className="text-[10px] text-slate-500">Capital movement</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Customer Concentration Analysis */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">Customer Concentration & Churn Sensitivity</h3>
          </div>
          <span className="text-xs text-slate-500">Top 10 Enterprise Accounts</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topClients.map((client, idx) => (
            <div
              key={client.customer}
              onClick={() => {
                const txs = yearTxs.filter(t => t.counterparty === client.customer);
                onDrilldown(client.customer, `Client account ledger`, txs);
              }}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <span className="truncate max-w-[200px]">
                  #{idx + 1}. {client.customer}
                </span>
                <span className="font-mono text-teal-700">{formatGBP(client.revenue)}</span>
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                <span>Concentration share: <strong className="text-slate-700">{client.percentage}%</strong></span>
                <span>Invoices: {client.invoiceCount}</span>
              </div>

              {client.outstanding > 0 && (
                <div className="mt-1 text-[10px] text-amber-700 font-semibold">
                  Awaiting settlement: {formatGBP(client.outstanding)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
