import React, { useState, useMemo } from 'react';
import {
  SlidersHorizontal,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Percent,
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
} from 'recharts';
import { Transaction, ScenarioLever } from '../types/financial';
import { simulateScenario } from '../services/calculationEngine';
import { getScenarioInsight } from '../services/aiClient';
import { formatGBP, formatPercent } from '../utils/formatters';

interface ScenarioLabTabProps {
  transactions: Transaction[];
  companyName: string;
}

export const ScenarioLabTab: React.FC<ScenarioLabTabProps> = ({
  transactions,
  companyName,
}) => {
  const years = useMemo(() => {
    return Array.from(new Set(transactions.map(t => t.year))).sort((a, b) => b - a);
  }, [transactions]);

  const [targetYear, setTargetYear] = useState<number>(years[0] || 2025);

  // Default strategic levers
  const [levers, setLevers] = useState<ScenarioLever[]>([
    {
      id: 'price_increase',
      name: '10% Price Increase on SaaS Subscriptions',
      type: 'price_change',
      impactTarget: 'category',
      targetCategory: 'Software Subscription',
      percentageDelta: 10,
      enabled: true,
      notes: 'Assumes zero customer churn; increases annual ARR directly.',
    },
    {
      id: 'hire_engineers',
      name: 'Hire 2 Senior Full-Stack Engineers',
      type: 'hire_staff',
      impactTarget: 'category',
      targetCategory: 'Salaries & Payroll',
      fixedAnnualDelta: 140000,
      enabled: false,
      notes: '£70k salary each + employer NIC / pension overheads.',
    },
    {
      id: 'optimize_cloud',
      name: 'Cloud Infrastructure Optimization (-15%)',
      type: 'cost_reduction',
      impactTarget: 'category',
      targetCategory: 'Cloud Hosting',
      percentageDelta: -15,
      enabled: true,
      notes: 'AWS/GCP reserved instances, Kubernetes node rightsizing.',
    },
    {
      id: 'churn_risk',
      name: 'Customer Churn Stress-Test (-8% Revenue)',
      type: 'customer_churn',
      impactTarget: 'revenue',
      percentageDelta: -8,
      enabled: false,
      notes: 'Simulate macroeconomic headwinds or loss of a key client.',
    },
    {
      id: 'marketing_ramp',
      name: 'Marketing Boost (£30k ad spend -> +6% Revenue)',
      type: 'marketing_boost',
      impactTarget: 'operating_expense',
      fixedAnnualDelta: 30000,
      enabled: false,
      notes: 'Demand generation push with targeted enterprise pipeline.',
    },
  ]);

  // Custom lever creation modal/state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLeverName, setNewLeverName] = useState('');
  const [newLeverTarget, setNewLeverTarget] = useState<'revenue' | 'operating_expense'>('revenue');
  const [newLeverDeltaPct, setNewLeverDeltaPct] = useState<number>(5);
  const [newLeverFixed, setNewLeverFixed] = useState<number>(0);

  // AI Stress Test State
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Run simulation engine
  const simulation = useMemo(() => {
    return simulateScenario(transactions, targetYear, levers);
  }, [transactions, targetYear, levers]);

  const toggleLever = (id: string) => {
    setLevers(prev =>
      prev.map(l => (l.id === id ? { ...l, enabled: !l.enabled } : l))
    );
  };

  const deleteLever = (id: string) => {
    setLevers(prev => prev.filter(l => l.id !== id));
  };

  const handleAddCustomLever = () => {
    if (!newLeverName.trim()) return;
    const newL: ScenarioLever = {
      id: `custom_${Date.now()}`,
      name: newLeverName.trim(),
      type: 'custom',
      impactTarget: newLeverTarget,
      percentageDelta: newLeverDeltaPct !== 0 ? newLeverDeltaPct : undefined,
      fixedAnnualDelta: newLeverFixed !== 0 ? newLeverFixed : undefined,
      enabled: true,
      notes: 'Custom scenario assumption.',
    };
    setLevers(prev => [...prev, newL]);
    setShowAddModal(false);
    setNewLeverName('');
    setNewLeverDeltaPct(5);
    setNewLeverFixed(0);
  };

  const handleRunAiStressTest = async () => {
    try {
      setIsAiLoading(true);
      const res = await getScenarioInsight(
        {
          targetYear,
          activeLevers: levers.filter(l => l.enabled),
          simulationResults: simulation,
        },
        companyName
      );
      setAiInsight(res.insight);
    } catch (err: any) {
      setAiInsight(`Error running scenario insight: ${err.message}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Scenario Lab Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Scenario Modelling Lab</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 uppercase tracking-wider">
              Interactive Sandbox
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Model business decisions and instantly calculate their financial consequences on revenue, margin, and operating profit.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Baseline Year:</span>
            <select
              value={targetYear}
              onChange={e => setTargetYear(parseInt(e.target.value, 10))}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-bold text-xs cursor-pointer"
            >
              {years.map(y => (
                <option key={y} value={y}>
                  FY {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Lever</span>
          </button>
        </div>
      </div>

      {/* Levers Control Strip */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Decision Levers & Sensitivity Assumptions ({levers.filter(l => l.enabled).length} active)
          </span>
          <button
            onClick={() => {
              setLevers(prev => prev.map(l => ({ ...l, enabled: false })));
            }}
            className="text-xs text-slate-500 hover:text-rose-600 font-medium cursor-pointer"
          >
            Reset All Levers
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {levers.map(lever => (
            <div
              key={lever.id}
              className={`p-3.5 rounded-xl border transition-all ${
                lever.enabled
                  ? 'border-teal-500 bg-teal-50/20 shadow-2xs'
                  : 'border-slate-200 bg-slate-50/60 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={lever.enabled}
                    onChange={() => toggleLever(lever.id)}
                    className="mt-1 w-4 h-4 text-teal-600 rounded-sm border-slate-300 focus:ring-teal-500 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">{lever.name}</div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{lever.notes}</p>
                  </div>
                </div>

                {lever.type === 'custom' && (
                  <button
                    onClick={() => deleteLever(lever.id)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium capitalize">
                  Target: {lever.targetCategory || lever.impactTarget.replace('_', ' ')}
                </span>
                <span className="font-mono font-bold text-teal-700">
                  {lever.percentageDelta !== undefined
                    ? `${lever.percentageDelta > 0 ? '+' : ''}${lever.percentageDelta}%`
                    : formatGBP(lever.fixedAnnualDelta || 0)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Side-by-Side Impact Comparison Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Impact */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Simulated Revenue</span>
          <div className="mt-2 text-xl font-black text-slate-900">
            {formatGBP(simulation.simulatedKPIs.totalRevenue)}
          </div>
          <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
            <span>Base: {formatGBP(simulation.baseKPIs.totalRevenue)}</span>
            <span
              className={`font-bold ${
                simulation.variances.revenue >= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {simulation.variances.revenue >= 0 ? '+' : ''}
              {formatGBP(simulation.variances.revenue)} ({formatPercent(simulation.variances.revenuePct)})
            </span>
          </div>
        </div>

        {/* Expense Impact */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Simulated Expenses</span>
          <div className="mt-2 text-xl font-black text-slate-900">
            {formatGBP(simulation.simulatedKPIs.totalOperatingExpenses)}
          </div>
          <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
            <span>Base: {formatGBP(simulation.baseKPIs.totalOperatingExpenses)}</span>
            <span
              className={`font-bold ${
                simulation.variances.expense <= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {simulation.variances.expense >= 0 ? '+' : ''}
              {formatGBP(simulation.variances.expense)}
            </span>
          </div>
        </div>

        {/* Operating Profit Impact */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Simulated Operating Profit</span>
          <div
            className={`mt-2 text-xl font-black ${
              simulation.simulatedKPIs.operatingProfit >= 0 ? 'text-teal-700' : 'text-rose-600'
            }`}
          >
            {formatGBP(simulation.simulatedKPIs.operatingProfit)}
          </div>
          <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
            <span>Base: {formatGBP(simulation.baseKPIs.operatingProfit)}</span>
            <span
              className={`font-bold ${
                simulation.variances.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {simulation.variances.profit >= 0 ? '+' : ''}
              {formatGBP(simulation.variances.profit)}
            </span>
          </div>
        </div>

        {/* Operating Margin Shift */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Operating Margin</span>
          <div className="mt-2 text-xl font-black text-slate-900">
            {simulation.simulatedKPIs.operatingProfitMargin}%
          </div>
          <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
            <span>Base: {simulation.baseKPIs.operatingProfitMargin}%</span>
            <span
              className={`font-bold ${
                simulation.variances.marginDeltaPct >= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {simulation.variances.marginDeltaPct >= 0 ? '+' : ''}
              {simulation.variances.marginDeltaPct}% pts
            </span>
          </div>
        </div>
      </div>

      {/* Trajectory Comparison Chart */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Monthly Operating Profit: Base vs. Simulated Scenario</h3>
            <p className="text-xs text-slate-500">Visualise the monthly delta across the reporting period</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunAiStressTest}
              disabled={isAiLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-teal-600 to-sky-600 text-white rounded-xl text-xs font-bold hover:opacity-95 shadow-2xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAiLoading ? 'Evaluating Scenario...' : 'AI CFO Stress Test'}</span>
            </button>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={simulation.simulatedMonthly}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
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
              <Line
                type="monotone"
                dataKey="baseProfit"
                name="Base Operating Profit (£)"
                stroke="#94A3B8"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="simulatedProfit"
                name="Simulated Operating Profit (£)"
                stroke="#0D9488"
                strokeWidth={3}
                dot={{ r: 4, fill: '#0D9488' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI CFO Stress Test Result */}
      {aiInsight && (
        <div className="bg-white rounded-2xl p-6 border border-teal-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>AI Chief Financial Officer — Strategic Scenario Evaluation</span>
          </div>

          <div className="prose prose-xs max-w-none text-xs text-slate-800 whitespace-pre-line leading-relaxed bg-teal-50/30 p-4 rounded-xl border border-teal-100">
            {aiInsight}
          </div>
        </div>
      )}

      {/* Modal for Adding Custom Lever */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Define Custom Scenario Lever</h3>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Lever Name / Strategic Goal</label>
              <input
                type="text"
                placeholder="e.g. Expand into North America, Cut Travel 20%..."
                value={newLeverName}
                onChange={e => setNewLeverName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Target Dimension</label>
                <select
                  value={newLeverTarget}
                  onChange={e => setNewLeverTarget(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="revenue">Total Revenue</option>
                  <option value="operating_expense">Operating Expenses</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Percentage Shift (%)</label>
                <input
                  type="number"
                  value={newLeverDeltaPct}
                  onChange={e => setNewLeverDeltaPct(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Or Fixed Annual Delta (£)</label>
              <input
                type="number"
                placeholder="0"
                value={newLeverFixed || ''}
                onChange={e => setNewLeverFixed(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomLever}
                disabled={!newLeverName.trim()}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold"
              >
                Add Lever to Simulator
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
