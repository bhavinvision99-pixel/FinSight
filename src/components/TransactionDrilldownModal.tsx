import React, { useState, useMemo } from 'react';
import { Transaction } from '../types/financial';
import { formatGBPExact, formatUKDate } from '../utils/formatters';
import { X, Search, Download, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  transactions: Transaction[];
}

export const TransactionDrilldownModal: React.FC<Props> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  transactions,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>('all');

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch =
        !searchTerm ||
        t.counterparty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [transactions, searchTerm, statusFilter]);

  const totalNet = useMemo(() => filtered.reduce((s, t) => s + t.netAmount, 0), [filtered]);
  const totalGross = useMemo(() => filtered.reduce((s, t) => s + t.grossAmount, 0), [filtered]);
  const totalVAT = useMemo(() => filtered.reduce((s, t) => s + t.vatAmount, 0), [filtered]);

  if (!isOpen) return null;

  const handleExportFiltered = () => {
    const csvContent = [
      ["ID", "Date", "Counterparty", "Type", "Category", "Description", "Net (£)", "VAT (£)", "Gross (£)", "Status"],
      ...filtered.map(t => [
        t.id,
        t.date,
        `"${t.counterparty.replace(/"/g, '""')}"`,
        t.type,
        `"${t.category.replace(/"/g, '""')}"`,
        `"${t.description.replace(/"/g, '""')}"`,
        t.netAmount.toFixed(2),
        t.vatAmount.toFixed(2),
        t.grossAmount.toFixed(2),
        t.status,
      ])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `drilldown_${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 uppercase tracking-wider">
                Audit Drill-Down
              </span>
              <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            </div>
            {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportFiltered}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Export View ({filtered.length})
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter and Summary Strip */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search counterparty, description, ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid / Open</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {/* Quick Net totals */}
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <div>
              Records: <span className="font-bold text-slate-900">{filtered.length}</span>
            </div>
            <div className="h-3 w-px bg-slate-300" />
            <div>
              Net: <span className="font-bold text-teal-700">{formatGBPExact(totalNet)}</span>
            </div>
            <div className="h-3 w-px bg-slate-300" />
            <div>
              VAT: <span className="font-bold text-slate-700">{formatGBPExact(totalVAT)}</span>
            </div>
            <div className="h-3 w-px bg-slate-300" />
            <div>
              Gross: <span className="font-bold text-slate-900">{formatGBPExact(totalGross)}</span>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              No transactions match the selected filters.
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0 z-10 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Ref / Date</th>
                  <th className="py-2.5 px-4">Counterparty & Description</th>
                  <th className="py-2.5 px-3">Type & Category</th>
                  <th className="py-2.5 px-4 text-right">Net Amount</th>
                  <th className="py-2.5 px-4 text-right">VAT</th>
                  <th className="py-2.5 px-4 text-right">Gross</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(t => {
                  const isIncome = t.type === 'income';
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="font-mono text-slate-900 font-medium">{t.id}</div>
                        <div className="text-[11px] text-slate-500">{formatUKDate(t.date)}</div>
                      </td>

                      <td className="py-2.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 truncate">{t.counterparty}</div>
                        <div className="text-slate-500 truncate text-[11px]">{t.description}</div>
                        {t.validationWarnings && t.validationWarnings.length > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-amber-600 mt-0.5">
                            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                            <span>{t.validationWarnings[0]}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1">
                          {isIncome ? (
                            <ArrowUpRight className="w-3 h-3 text-teal-600" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3 text-rose-500" />
                          )}
                          <span className="font-medium capitalize text-slate-800">{t.category}</span>
                        </div>
                        {t.isRecurring && (
                          <span className="inline-block px-1.5 py-0.2 rounded text-[10px] bg-sky-50 text-sky-700 font-medium">
                            Recurring
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-4 text-right font-mono font-medium text-slate-900">
                        {formatGBPExact(t.netAmount)}
                      </td>

                      <td className="py-2.5 px-4 text-right font-mono text-slate-500">
                        {formatGBPExact(t.vatAmount)}
                      </td>

                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatGBPExact(t.grossAmount)}
                      </td>

                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                            t.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : t.status === 'overdue'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>* All operating revenue and expenses are accounted net of VAT according to GAAP.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close View
          </button>
        </div>
      </div>
    </div>
  );
};
