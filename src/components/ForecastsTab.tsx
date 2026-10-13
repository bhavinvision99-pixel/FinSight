import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Sliders,
  Calendar,
  AlertCircle,
  HelpCircle,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { Transaction, ForecastAssumptions } from '../types/financial';
import { generateForecast } from '../services/calculationEngine';
import { formatGBP } from '../utils/formatters';

interface ForecastsTabProps {
  transactions: Transaction[];
  companyName: string;
}

export const ForecastsTab: React.FC<ForecastsTabProps> = ({
  transactions,
  companyName,
}) => {
  const [assumptions, setAssumptions] = useState<ForecastAssumptions>({
    timeHorizonMonths: 12,
    scenarioMode: 'base',
    annualRevenueGrowthPct: 22,
    annualExpenseInflationPct: 6,
    plannedMonthlyNewHiresCost: 4000,
    subscriptionChurnRatePct: 2,
    newProductExpansionMonthlyBoost: 1500,
  });

  const forecastPoints = useMemo(() => {
    return generateForecast(transactions, assumptions);
  }, [transactions, assumptions]);

  const totalProjectedRevenue = useMemo(() => {
    return forecastPoints.reduce((s, p) => s + p.projectedRevenue, 0);
  }, [forecastPoints]);

  const totalProjectedExpense = useMemo(() => {
    return forecastPoints.reduce((s, p) => s + p.projectedExpense, 0);
  }, [forecastPoints]);

  const totalProjectedProfit = totalProjectedRevenue - totalProjectedExpense;
  const avgMargin = totalProjectedRevenue > 0 ? (totalProjectedProfit / totalProjectedRevenue) * 100 : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Forecast Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Forward Financial Forecasting</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 uppercase tracking-wider">
              {assumptions.timeHorizonMonths} Months Horizon
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Project future revenue, burn rate, and operating profits using transparent, adjustable assumptions.
          </p>
        </div>

        {/* Scenario Mode Segmented Control */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Model Bias:</span>
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            {(['bear', 'base', 'bull'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setAssumptions(prev => ({ ...prev, scenarioMode: mode }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  assumptions.scenarioMode === mode
                    ? mode === 'bull'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : mode === 'bear'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode} Case
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Assumptions Control Grid */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-teal-600" />
            <span>Transparent Model Assumptions</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Projection Horizon:</span>
            <button
              onClick={() => setAssumptions(prev => ({ ...prev, timeHorizonMonths: 12 }))}
              className={`px-2.5 py-1 rounded-md font-bold text-xs ${
                assumptions.timeHorizonMonths === 12
                  ? 'bg-teal-50 text-teal-700 border border-teal-300'
                  : 'text-slate-600 bg-slate-50'
              }`}
            >
              12 Months
            </button>
            <button
              onClick={() => setAssumptions(prev => ({ ...prev, timeHorizonMonths: 24 }))}
              className={`px-2.5 py-1 rounded-md font-bold text-xs ${
                assumptions.timeHorizonMonths === 24
                  ? 'bg-teal-50 text-teal-700 border border-teal-300'
                  : 'text-slate-600 bg-slate-50'
              }`}
            >
              24 Months
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue Growth Slider */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700">Target Organic Growth</span>
              <span className="font-mono text-teal-700 font-bold">{assumptions.annualRevenueGrowthPct}% / yr</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="1"
              value={assumptions.annualRevenueGrowthPct}
              onChange={e =>
                setAssumptions(prev => ({ ...prev, annualRevenueGrowthPct: parseInt(e.target.value, 10) }))
              }
              className="w-full accent-teal-600 cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">Based on historic 2024-2025 SaaS trajectory.</p>
          </div>

          {/* Expense Inflation Slider */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700">Cost Inflation</span>
              <span className="font-mono text-rose-600 font-bold">{assumptions.annualExpenseInflationPct}% / yr</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="0.5"
              value={assumptions.annualExpenseInflationPct}
              onChange={e =>
                setAssumptions(prev => ({ ...prev, annualExpenseInflationPct: parseFloat(e.target.value) }))
              }
              className="w-full accent-rose-600 cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">Cloud host pricing, supplier increases.</p>
          </div>

          {/* Monthly New Hires Cost */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700">Planned Monthly Hires</span>
              <span className="font-mono text-slate-900 font-bold">
                {formatGBP(assumptions.plannedMonthlyNewHiresCost)}/mo
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="15000"
              step="500"
              value={assumptions.plannedMonthlyNewHiresCost}
              onChange={e =>
                setAssumptions(prev => ({ ...prev, plannedMonthlyNewHiresCost: parseInt(e.target.value, 10) }))
              }
              className="w-full accent-slate-800 cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">Additional engineering & sales capacity.</p>
          </div>

          {/* Subscription Churn */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700">Annual Churn Rate</span>
              <span className="font-mono text-amber-700 font-bold">{assumptions.subscriptionChurnRatePct}% / yr</span>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              step="0.5"
              value={assumptions.subscriptionChurnRatePct}
              onChange={e =>
                setAssumptions(prev => ({ ...prev, subscriptionChurnRatePct: parseFloat(e.target.value) }))
              }
              className="w-full accent-amber-600 cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">Expected annual customer attrition.</p>
          </div>
        </div>
      </div>

      {/* Forecast Cumulative KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Projected Revenue</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{formatGBP(totalProjectedRevenue)}</div>
          <span className="text-[11px] text-slate-500">Over {assumptions.timeHorizonMonths} months</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Projected Expenses</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{formatGBP(totalProjectedExpense)}</div>
          <span className="text-[11px] text-slate-500">Includes planned hires</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cumulative Operating Profit</span>
          <div className={`text-2xl font-black mt-1 ${totalProjectedProfit >= 0 ? 'text-teal-700' : 'text-rose-600'}`}>
            {formatGBP(totalProjectedProfit)}
          </div>
          <span className="text-[11px] text-slate-500">Average margin: {avgMargin.toFixed(1)}%</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ending Monthly Run-Rate</span>
          <div className="text-2xl font-black text-teal-700 mt-1">
            {formatGBP(forecastPoints[forecastPoints.length - 1]?.projectedRevenue || 0)}
          </div>
          <span className="text-[11px] text-slate-500">Projected Exit ARR</span>
        </div>
      </div>

      {/* Forward Trajectory Chart */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Forward Projection Trajectory</h3>
            <p className="text-xs text-slate-500">Revenue expansion vs. cost structure</p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
            Case: {assumptions.scenarioMode.toUpperCase()}
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastPoints} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0D9488" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="periodLabel" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748B' }}
                tickFormatter={val => `£${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip
                formatter={(val: any) => [formatGBP(val), '']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Area
                type="monotone"
                dataKey="projectedRevenue"
                name="Projected Monthly Revenue (£)"
                stroke="#0D9488"
                fillOpacity={1}
                fill="url(#colorRev)"
                strokeWidth={2.5}
              />
              <Line
                type="monotone"
                dataKey="projectedExpense"
                name="Projected Monthly Expenses (£)"
                stroke="#E11D48"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="projectedOperatingProfit"
                name="Operating Profit (£)"
                stroke="#2563EB"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Projection Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-900">Monthly Forecast Ledger</h3>
          <span className="text-xs text-slate-500">{forecastPoints.length} Periods</span>
        </div>

        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 text-slate-500 font-semibold border-b border-slate-200 sticky top-0 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Period</th>
                <th className="py-2.5 px-4 text-right">Projected Revenue</th>
                <th className="py-2.5 px-4 text-right">Projected Expenses</th>
                <th className="py-2.5 px-4 text-right">Operating Profit</th>
                <th className="py-2.5 px-4 text-right">Operating Margin</th>
                <th className="py-2.5 px-4 text-right">Cumulative Cashflow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {forecastPoints.map(p => (
                <tr key={p.monthIndex} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2 px-4 font-bold text-slate-900">{p.periodLabel}</td>
                  <td className="py-2 px-4 text-right font-mono font-medium text-teal-800">
                    {formatGBP(p.projectedRevenue)}
                  </td>
                  <td className="py-2 px-4 text-right font-mono text-rose-700">
                    {formatGBP(p.projectedExpense)}
                  </td>
                  <td className={`py-2 px-4 text-right font-mono font-bold ${p.projectedOperatingProfit >= 0 ? 'text-teal-700' : 'text-rose-600'}`}>
                    {formatGBP(p.projectedOperatingProfit)}
                  </td>
                  <td className="py-2 px-4 text-right">{p.projectedMargin}%</td>
                  <td className="py-2 px-4 text-right font-mono font-medium text-slate-900">
                    {formatGBP(p.cumulativeCashflow)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
