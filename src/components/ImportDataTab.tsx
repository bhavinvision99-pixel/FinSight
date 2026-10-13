import React, { useState } from 'react';
import {
  UploadCloud,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  FileSpreadsheet,
  ArrowRight,
  RefreshCw,
  Download,
  AlertCircle,
  Eye,
} from 'lucide-react';
import {
  parseCsvContent,
  normaliseAndValidateTransactions,
  STANDARD_FIELDS,
  ParseResult,
} from '../services/csvImportService';
import { Transaction, ValidationIssue, ReconciliationSummary } from '../types/financial';
import { calculateReconciliationSummary } from '../services/calculationEngine';
import { generateHarbourStackTransactions, exportTransactionsToCSV } from '../data/harbourstackData';
import { formatGBP, formatGBPExact } from '../utils/formatters';

interface ImportDataTabProps {
  currentTransactions: Transaction[];
  onImportComplete: (newTransactions: Transaction[]) => void;
  onDrilldown: (title: string, subtitle: string, txs: Transaction[]) => void;
}

export const ImportDataTab: React.FC<ImportDataTabProps> = ({
  currentTransactions,
  onImportComplete,
  onDrilldown,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [fileName, setFileName] = useState<string>('');
  const [rawParseResult, setRawParseResult] = useState<ParseResult | null>(null);
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [stagedTransactions, setStagedTransactions] = useState<Transaction[]>([]);
  const [reconciliation, setReconciliation] = useState<ReconciliationSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // File Upload handler
  const handleFileUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      setErrorMsg(null);
      setFileName(file.name);
      const text = await file.text();
      const parsed = await parseCsvContent(text);
      setRawParseResult(parsed);
      setFieldMappings(parsed.suggestedMappings);
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse CSV file.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Load Synthetic HarbourStack CSV
  const handleLoadSyntheticSample = async () => {
    try {
      setIsProcessing(true);
      setErrorMsg(null);
      const sampleTxs = generateHarbourStackTransactions();
      const csvContent = exportTransactionsToCSV(sampleTxs);
      setFileName('HarbourStack_2024_2025_Synthetic_Ledger.csv');
      const parsed = await parseCsvContent(csvContent);
      setRawParseResult(parsed);
      setFieldMappings(parsed.suggestedMappings);
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load sample dataset.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Proceed from Mapping to Validation (Step 2 -> Step 3)
  const handleProceedToValidation = () => {
    if (!rawParseResult) return;
    try {
      const { transactions, issues } = normaliseAndValidateTransactions(
        rawParseResult.allRows,
        fieldMappings
      );
      setStagedTransactions(transactions);
      setValidationIssues(issues);
      const rec = calculateReconciliationSummary(transactions);
      setReconciliation(rec);
      setStep(3);
    } catch (err: any) {
      setErrorMsg(`Validation error: ${err.message}`);
    }
  };

  // Complete Import (Step 3 -> Step 4)
  const handleFinalizeImport = () => {
    if (stagedTransactions.length === 0) return;
    onImportComplete(stagedTransactions);
    setStep(4);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Wizard Progress Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
          {[
            { num: 1, title: '1. Select CSV' },
            { num: 2, title: '2. Review Mappings' },
            { num: 3, title: '3. Data Validation' },
            { num: 4, title: '4. Reconciliation' },
          ].map(s => {
            const isCurrent = step === s.num;
            const isDone = step > s.num;
            return (
              <div
                key={s.num}
                className={`p-2 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-teal-50 text-teal-800 border border-teal-300 font-bold'
                    : isDone
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-600 bg-slate-50'
                }`}
              >
                {s.title}
              </div>
            );
          })}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: Select CSV / Load Sample */}
      {step === 1 && (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-2xs space-y-6">
          <div className="text-center max-w-lg mx-auto">
            <h2 className="text-lg font-bold text-slate-900">Import Financial Transactions</h2>
            <p className="text-xs text-slate-500 mt-1">
              Upload multi-year transaction files (e.g. Xero, QuickBooks, Sage, or custom ERP exports). FinSight will auto-detect headers and validate accounting rules.
            </p>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-10 text-center transition-all bg-slate-50/50 hover:bg-teal-50/20"
          >
            <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4">
              <UploadCloud className="w-7 h-7" />
            </div>

            <div className="text-sm font-bold text-slate-800">
              Drag and drop your transaction CSV here
            </div>
            <p className="text-xs text-slate-500 mt-1">Supports UTF-8 CSV with net, VAT, and gross amounts</p>

            <div className="mt-5">
              <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 cursor-pointer shadow-sm transition-all">
                <span>Browse Files</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {/* Pre-packaged Sample Data Option */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/70 p-4 rounded-xl">
            <div>
              <div className="text-xs font-bold text-slate-800">Need synthetic data for demonstration?</div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Load the complete 2024–2025 synthetic dataset for <strong>HarbourStack Software Ltd</strong> (~150 transactions).
              </p>
            </div>

            <button
              onClick={handleLoadSyntheticSample}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Load HarbourStack 2024-2025 Dataset</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Review Mappings */}
      {step === 2 && rawParseResult && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Map Financial Fields</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review auto-matched columns from <strong>{fileName}</strong> ({rawParseResult.allRows.length} rows detected). Correct any mapping below.
              </p>
            </div>

            <button
              onClick={() => setStep(1)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Choose Different File
            </button>
          </div>

          {/* Column Mapping Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {STANDARD_FIELDS.map(field => {
              const currentHeader = fieldMappings[field.key] || '';
              return (
                <div
                  key={field.key}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800">{field.label}</span>
                      {field.required && (
                        <span className="text-[10px] text-rose-500 font-bold">*Required</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">standard: {field.key}</span>
                  </div>

                  <select
                    value={currentHeader}
                    onChange={e => {
                      setFieldMappings(prev => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }));
                    }}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none min-w-[150px] cursor-pointer"
                  >
                    <option value="">-- Unmapped --</option>
                    {rawParseResult.headers.map(h => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          {/* Raw Sample Preview */}
          <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700">
              CSV Preview (First 3 Records)
            </div>
            <div className="overflow-x-auto text-[11px] font-mono p-2 bg-slate-50">
              <pre>{JSON.stringify(rawParseResult.sampleRows.slice(0, 3), null, 2)}</pre>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Back
            </button>
            <button
              onClick={handleProceedToValidation}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-2xs cursor-pointer transition-colors"
            >
              <span>Validate & Inspect Accounting Rules</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Data Validation & Warning Inspection */}
      {step === 3 && reconciliation && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Validation & Audit Diagnostics</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Found {stagedTransactions.length} total records across {reconciliation.yearsCovered.join(', ')}.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                {reconciliation.validRecords} Clean Records
              </span>
              {reconciliation.warningsCount > 0 && (
                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800">
                  {reconciliation.warningsCount} Validation Warnings
                </span>
              )}
            </div>
          </div>

          {/* Validation Warnings Table */}
          {validationIssues.length > 0 ? (
            <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Accounting & Calculation Warnings Detected ({validationIssues.length})</span>
              </div>
              <p className="text-[11px] text-amber-800 mb-3">
                FinSight never silently removes transactions. All records are retained for transparent audit trail.
              </p>

              <div className="max-h-56 overflow-y-auto space-y-2">
                {validationIssues.slice(0, 15).map((issue, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-white rounded-lg border border-amber-200/80 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-800">Row {issue.row} ({issue.transactionId}):</span>{' '}
                      <span className="text-slate-600">{issue.message}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      {issue.type.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong>Zero validation errors detected!</strong> All transaction IDs, dates, VAT calculations, and net sums reconcile cleanly with GAAP.
              </div>
            </div>
          )}

          {/* Preliminary Reconciliation Snapshot */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 font-medium">Operating Revenue (Net)</span>
              <div className="text-sm font-bold text-slate-900 mt-1">
                {formatGBP(reconciliation.totalOperatingRevenueNet)}
              </div>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Operating Expenses (Net)</span>
              <div className="text-sm font-bold text-slate-900 mt-1">
                {formatGBP(reconciliation.totalOperatingExpenseNet)}
              </div>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Operating Profit</span>
              <div className="text-sm font-bold text-teal-700 mt-1">
                {formatGBP(reconciliation.operatingProfitNet)}
              </div>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Unpaid Receivables</span>
              <div className="text-sm font-bold text-amber-700 mt-1">
                {formatGBP(reconciliation.unpaidInvoicesNet)}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Back to Mapping
            </button>
            <button
              onClick={handleFinalizeImport}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs cursor-pointer transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Normalise into FinSight</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Reconciliation Summary */}
      {step === 4 && reconciliation && (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-2xs space-y-6 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">Import & Reconciliation Successful!</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {stagedTransactions.length} transactions have been normalised and added to the active ledger.
            </p>
          </div>

          {/* Full Reconciliation Card */}
          <div className="text-left bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 max-w-xl mx-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="font-bold text-slate-800">Accounting Summary</span>
              <span className="text-slate-500">Period: {reconciliation.earliestDate} to {reconciliation.latestDate}</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Valid Records</span>
                <span className="font-bold text-slate-900">{reconciliation.totalRecords}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Operating Net Revenue</span>
                <span className="font-bold text-slate-900">{formatGBPExact(reconciliation.totalOperatingRevenueNet)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Operating Net Expenses</span>
                <span className="font-bold text-slate-900">{formatGBPExact(reconciliation.totalOperatingExpenseNet)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Net Operating Profit</span>
                <span className="font-bold text-teal-700">{formatGBPExact(reconciliation.operatingProfitNet)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">VAT Collected (Output)</span>
                <span className="font-mono text-slate-700">{formatGBPExact(reconciliation.totalVatCollected)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">VAT Paid (Input)</span>
                <span className="font-mono text-slate-700">{formatGBPExact(reconciliation.totalVatPaid)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                <span className="text-slate-800">Net VAT Liability to HMRC</span>
                <span className="text-slate-900">{formatGBPExact(reconciliation.netVatPayable)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                onDrilldown('Imported Ledger', `All ${stagedTransactions.length} imported records`, stagedTransactions);
              }}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Inspect All Records</span>
            </button>
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 cursor-pointer"
            >
              Upload Another CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
