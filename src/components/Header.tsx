import React from 'react';
import { Building2, Calendar, FileDown, RefreshCw, Upload, ShieldCheck } from 'lucide-react';
import { exportTransactionsToCSV } from '../data/harbourstackData';
import { Transaction } from '../types/financial';

interface HeaderProps {
  companyName: string;
  setCompanyName: (name: string) => void;
  activePeriod: string;
  transactions: Transaction[];
  onResetData: () => void;
  onNavigateToImport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  companyName,
  setCompanyName,
  activePeriod,
  transactions,
  onResetData,
  onNavigateToImport,
}) => {
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [tempName, setTempName] = React.useState(companyName);

  const handleDownloadSample = () => {
    const csvStr = exportTransactionsToCSV(transactions);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'HarbourStack_2024_2025_Financial_Transactions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      setCompanyName(tempName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Company & Active Scope */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-teal-400 font-bold text-lg shadow-sm">
              <Building2 className="w-5 h-5 text-teal-400" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <input
                    type="text"
                    value={tempName}
                    onChange={e => setTempName(e.target.value)}
                    onBlur={handleSaveName}
                    onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                    autoFocus
                    className="text-base font-bold text-slate-900 border-b border-teal-500 focus:outline-none"
                  />
                ) : (
                  <span
                    onClick={() => {
                      setTempName(companyName);
                      setIsEditingName(true);
                    }}
                    title="Click to rename active company"
                    className="text-base font-bold text-slate-900 hover:text-teal-700 cursor-pointer transition-colors"
                  >
                    {companyName}
                  </span>
                )}
                <span className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                  SME B2B SaaS
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                <span className="flex items-center gap-1 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Period: <strong className="text-slate-700">{activePeriod}</strong>
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1 font-medium text-slate-600">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  GBP (£) • UK GAAP Net Accruals
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadSample}
            title="Download full 2024-2025 transaction dataset as CSV for inspection or offline analysis"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-500" />
            Download Sample CSV
          </button>

          <button
            onClick={onNavigateToImport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Import CSV
          </button>

          <button
            onClick={onResetData}
            title="Reset dataset back to standard HarbourStack 2024-2025 records"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
