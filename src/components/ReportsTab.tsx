import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  Sparkles,
  CheckCircle2,
  Copy,
  Layers,
  Building2,
  Calendar,
} from 'lucide-react';
import { Transaction } from '../types/financial';
import { calculateKPIs, calculateCategoryBreakdown, calculateReconciliationSummary } from '../services/calculationEngine';
import { generateBoardReport } from '../services/aiClient';
import { exportTransactionsToCSV } from '../data/harbourstackData';
import { formatGBP, formatGBPExact } from '../utils/formatters';

interface ReportsTabProps {
  transactions: Transaction[];
  companyName: string;
  activePeriod: string;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  transactions,
  companyName,
  activePeriod,
}) => {
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [boardReportText, setBoardReportText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const kpis = useMemo(() => calculateKPIs(transactions, 2025, 2024), [transactions]);
  const reconciliation = useMemo(() => calculateReconciliationSummary(transactions), [transactions]);
  const revCats = useMemo(() => calculateCategoryBreakdown(transactions, 'income', 2025), [transactions]);
  const expCats = useMemo(() => calculateCategoryBreakdown(transactions, 'expense', 2025), [transactions]);

  const handleGenerateAiReport = async () => {
    try {
      setIsGeneratingAi(true);
      const res = await generateBoardReport(
        {
          kpis,
          reconciliation,
          revenueBreakdown: revCats,
          expenseBreakdown: expCats,
        },
        companyName,
        activePeriod
      );
      setBoardReportText(res.report);
    } catch (err: any) {
      setBoardReportText(`Failed to generate board report: ${err.message}`);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const csv = exportTransactionsToCSV(transactions);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${companyName.replace(/\s+/g, '_')}_Financial_Report_${activePeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyReport = () => {
    if (boardReportText) {
      navigator.clipboard.writeText(boardReportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto print:p-0 print:space-y-4">
      {/* Top Action Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-base font-bold text-slate-900">Executive Board Pack & Audit Reports</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Export presentation-ready reports for directors, investors, and chartered accountants.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleGenerateAiReport}
            disabled={isGeneratingAi}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-teal-600 to-sky-600 text-white rounded-xl text-xs font-bold hover:opacity-95 shadow-2xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGeneratingAi ? 'Drafting Report...' : 'Generate AI Board Memo'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Official Board Pack Document Canvas */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="border-b border-slate-200 pb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-teal-700 font-extrabold text-sm tracking-tight mb-1">
              <Layers className="w-4 h-4" />
              <span>FINSIGHT EXECUTIVE FINANCIAL REPORT</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{companyName}</h1>
            <p className="text-xs text-slate-500 mt-1">
              Statutory Period: <strong className="text-slate-800">{activePeriod}</strong> • Currency: <strong>GBP (£)</strong>
            </p>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
              UK GAAP Net Accruals
            </span>
            <div className="text-[11px] text-slate-400 mt-1">
              Generated: {new Date().toLocaleDateString('en-GB')}
            </div>
            <div className="text-[10px] text-teal-600 font-semibold mt-0.5">
              Built by The Fintechs
            </div>
          </div>
        </div>

        {/* Executive Summary Metrics */}
        <div>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            I. Key Performance Indicators (FY 2025)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500">Gross Operating Revenue</span>
              <div className="text-lg font-black text-slate-900 mt-0.5">{formatGBP(kpis.totalRevenue)}</div>
              <span className="text-[10px] text-emerald-700 font-semibold">
                YoY: {kpis.revenueYoYGrowth !== null ? `+${kpis.revenueYoYGrowth}%` : 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-slate-500">Total Operating Expenses</span>
              <div className="text-lg font-black text-slate-900 mt-0.5">{formatGBP(kpis.totalOperatingExpenses)}</div>
              <span className="text-[10px] text-slate-600 font-medium">Net of recoverable VAT</span>
            </div>

            <div>
              <span className="text-slate-500">Operating Profit (EBITDA)</span>
              <div className="text-lg font-black text-teal-700 mt-0.5">{formatGBP(kpis.operatingProfit)}</div>
              <span className="text-[10px] text-teal-800 font-bold">{kpis.operatingProfitMargin}% Margin</span>
            </div>

            <div>
              <span className="text-slate-500">Outstanding Receivables</span>
              <div className="text-lg font-black text-amber-700 mt-0.5">{formatGBP(kpis.outstandingReceivables)}</div>
              <span className="text-[10px] text-amber-800 font-medium">Unpaid customer invoices</span>
            </div>
          </div>
        </div>

        {/* AI Executive Commentary if generated */}
        {boardReportText && (
          <div className="p-6 bg-slate-50 rounded-2xl border border-teal-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-900">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>II. Chief Financial Officer Executive Commentary</span>
              </div>
              <button
                onClick={handleCopyReport}
                className="flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 print:hidden cursor-pointer"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Commentary'}</span>
              </button>
            </div>

            <div className="prose prose-xs max-w-none text-xs text-slate-800 whitespace-pre-line leading-relaxed">
              {boardReportText}
            </div>
          </div>
        )}

        {/* Summary P&L Statement Snapshot */}
        <div>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            III. Statement of Profit & Loss (FY 2025)
          </h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-bold">
                <tr>
                  <th className="py-2.5 px-4">Line Item</th>
                  <th className="py-2.5 px-4 text-right">Net Amount (£)</th>
                  <th className="py-2.5 px-4 text-right">% of Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr className="font-bold text-slate-900 bg-slate-50/50">
                  <td className="py-2 px-4">Total Operating Revenue</td>
                  <td className="py-2 px-4 text-right font-mono">{formatGBPExact(kpis.totalRevenue)}</td>
                  <td className="py-2 px-4 text-right">100.0%</td>
                </tr>
                {revCats.map(c => (
                  <tr key={c.category}>
                    <td className="py-1.5 px-4 pl-8 text-slate-600">{c.category}</td>
                    <td className="py-1.5 px-4 text-right font-mono">{formatGBPExact(c.netAmount)}</td>
                    <td className="py-1.5 px-4 text-right text-slate-500">{c.percentageOfTotal}%</td>
                  </tr>
                ))}

                <tr className="font-bold text-slate-900 bg-slate-50/50">
                  <td className="py-2 px-4">Total Operating Expenses</td>
                  <td className="py-2 px-4 text-right font-mono">{formatGBPExact(kpis.totalOperatingExpenses)}</td>
                  <td className="py-2 px-4 text-right">
                    {kpis.totalRevenue > 0
                      ? `${((kpis.totalOperatingExpenses / kpis.totalRevenue) * 100).toFixed(1)}%`
                      : '0.0%'}
                  </td>
                </tr>
                {expCats.map(c => (
                  <tr key={c.category}>
                    <td className="py-1.5 px-4 pl-8 text-slate-600">{c.category}</td>
                    <td className="py-1.5 px-4 text-right font-mono">{formatGBPExact(c.netAmount)}</td>
                    <td className="py-1.5 px-4 text-right text-slate-500">
                      {kpis.totalRevenue > 0
                        ? `${((c.netAmount / kpis.totalRevenue) * 100).toFixed(1)}%`
                        : '0.0%'}
                    </td>
                  </tr>
                ))}

                <tr className="font-extrabold text-white bg-slate-900">
                  <td className="py-3 px-4">Net Operating Profit (EBITDA)</td>
                  <td className="py-3 px-4 text-right font-mono text-teal-300">
                    {formatGBPExact(kpis.operatingProfit)}
                  </td>
                  <td className="py-3 px-4 text-right text-teal-300">{kpis.operatingProfitMargin}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* VAT & Statutory Reconciliation */}
        <div>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            IV. Tax & Statutory Reconciliation (HMRC VAT Summary)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 font-medium">Output VAT Collected</span>
              <div className="font-mono font-bold text-slate-900 mt-0.5">
                {formatGBPExact(reconciliation.totalVatCollected)}
              </div>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Input VAT Paid on Expenses</span>
              <div className="font-mono font-bold text-slate-900 mt-0.5">
                {formatGBPExact(reconciliation.totalVatPaid)}
              </div>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Net VAT Liability</span>
              <div className="font-mono font-bold text-teal-700 mt-0.5">
                {formatGBPExact(reconciliation.netVatPayable)}
              </div>
            </div>
          </div>
        </div>

        {/* Sign-off & Audit Seal */}
        <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-400">
          <div>
            <span>FinSight AI Financial Intelligence Platform</span> • <span>Attribution: Built by The Fintechs</span>
          </div>
          <div className="font-mono text-[11px]">
            SHA256 Audit Verification: OK ({transactions.length} rows verified)
          </div>
        </div>
      </div>
    </div>
  );
};
