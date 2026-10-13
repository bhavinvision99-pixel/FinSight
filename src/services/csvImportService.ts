import Papa from 'papaparse';
import { Transaction, TransactionType, PaymentStatus, ValidationIssue } from '../types/financial';

export interface FieldMapping {
  standardField: keyof Transaction | 'unmapped';
  targetLabel: string;
  matchedCsvHeader: string | null;
  confidence: number;
}

export const STANDARD_FIELDS: { key: keyof Transaction; label: string; required: boolean }[] = [
  { key: 'id', label: 'Transaction ID / Reference', required: true },
  { key: 'date', label: 'Transaction Date', required: true },
  { key: 'invoiceDate', label: 'Invoice Date', required: false },
  { key: 'dueDate', label: 'Due Date', required: false },
  { key: 'paymentDate', label: 'Payment Date', required: false },
  { key: 'counterparty', label: 'Customer / Supplier / Payee', required: true },
  { key: 'description', label: 'Description / Line Item', required: false },
  { key: 'type', label: 'Transaction Type (Income/Expense/Loan/Equity)', required: true },
  { key: 'category', label: 'Account / Category', required: true },
  { key: 'netAmount', label: 'Net Amount (£)', required: true },
  { key: 'vatAmount', label: 'VAT Amount (£)', required: false },
  { key: 'grossAmount', label: 'Gross Amount (£)', required: false },
  { key: 'status', label: 'Payment Status (Paid/Unpaid/Overdue)', required: false },
  { key: 'isRecurring', label: 'Recurring (Yes/No)', required: false },
  { key: 'paymentMethod', label: 'Payment Method', required: false },
];

export interface ParseResult {
  headers: string[];
  sampleRows: Record<string, string>[];
  suggestedMappings: Record<string, string>; // standardField -> csvHeader
  allRows: Record<string, string>[];
}

/**
 * Parses raw CSV text or file and suggests optimal column mappings
 */
export function parseCsvContent(csvString: string): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(csvString, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          return reject(new Error('CSV file appears to be empty.'));
        }

        const headers = results.meta.fields || Object.keys(results.data[0]);
        const sampleRows = results.data.slice(0, 10);
        const suggestedMappings: Record<string, string> = {};

        // Intelligent header matching heuristics
        const lowerHeaders = headers.map(h => ({ original: h, clean: h.toLowerCase().replace(/[^a-z0-9]/g, '') }));

        const findHeaderMatch = (keywords: string[]) => {
          for (const kw of keywords) {
            const found = lowerHeaders.find(lh => lh.clean.includes(kw) || kw.includes(lh.clean));
            if (found) return found.original;
          }
          return null;
        };

        const fieldSynonyms: Record<string, string[]> = {
          id: ['transactionid', 'txid', 'invoicenumber', 'invoiceno', 'reference', 'ref', 'id'],
          date: ['transactiondate', 'txdate', 'date', 'dated', 'bookingdate'],
          invoiceDate: ['invoicedate', 'billingdate', 'invdate'],
          dueDate: ['duedate', 'paymentdue'],
          paymentDate: ['paymentdate', 'paiddate', 'settleddate'],
          counterparty: ['customer', 'supplier', 'client', 'vendor', 'payee', 'counterparty', 'accountname', 'name'],
          description: ['description', 'lineitem', 'details', 'memo', 'narrative', 'item'],
          type: ['transactiontype', 'type', 'flow', 'direction', 'incometype'],
          category: ['category', 'account', 'chartofaccounts', 'glcategory', 'expensetype', 'costcentre'],
          netAmount: ['netamount', 'net', 'subtotal', 'amountnet', 'exclvat'],
          vatAmount: ['vatamount', 'vat', 'tax', 'taxamount', 'gst'],
          grossAmount: ['grossamount', 'gross', 'total', 'amountgross', 'amount'],
          status: ['paymentstatus', 'status', 'state', 'paidstatus'],
          isRecurring: ['recurring', 'isrecurring', 'subscription', 'repeat'],
          paymentMethod: ['paymentmethod', 'method', 'channel'],
        };

        STANDARD_FIELDS.forEach(sf => {
          const matched = findHeaderMatch(fieldSynonyms[sf.key] || [sf.key]);
          if (matched) {
            suggestedMappings[sf.key] = matched;
          }
        });

        resolve({
          headers,
          sampleRows,
          suggestedMappings,
          allRows: results.data,
        });
      },
      error: (err: any) => {
        reject(err);
      }
    });
  });
}

/**
 * Normalises raw rows using finalized user mapping and runs rigorous financial validation rules
 */
export function normaliseAndValidateTransactions(
  rawRows: Record<string, string>[],
  mapping: Record<string, string> // standardField -> csvHeader
): {
  transactions: Transaction[];
  issues: ValidationIssue[];
  duplicateCount: number;
  totalErrors: number;
  totalWarnings: number;
} {
  const transactions: Transaction[] = [];
  const issues: ValidationIssue[] = [];
  const seenIds = new Set<string>();
  let duplicateCount = 0;
  let totalErrors = 0;
  let totalWarnings = 0;

  // Track potential double counts (same counterparty, same amount, within 2 days)
  const recentIncomeTracker: { counterparty: string; net: number; date: Date; rowIdx: number }[] = [];

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 2; // account for header line in CSV
    const rowWarnings: string[] = [];

    // Helper to get raw cell
    const getVal = (field: string): string => {
      const header = mapping[field];
      if (!header || row[header] === undefined) return '';
      return String(row[header]).trim();
    };

    // 1. Transaction ID
    let rawId = getVal('id');
    if (!rawId) {
      rawId = `TX-${idx + 10001}`;
      rowWarnings.push('Missing ID; auto-assigned reference.');
      issues.push({
        row: rowNum,
        transactionId: rawId,
        type: 'duplicate',
        message: 'Missing transaction reference ID.',
        severity: 'warning',
      });
      totalWarnings++;
    }

    let isDuplicate = false;
    if (seenIds.has(rawId)) {
      isDuplicate = true;
      duplicateCount++;
      rowWarnings.push(`Duplicate ID '${rawId}' detected.`);
      issues.push({
        row: rowNum,
        transactionId: rawId,
        type: 'duplicate',
        message: `Duplicate Transaction ID '${rawId}'. Both instances retained for audit.`,
        severity: 'warning',
      });
      totalWarnings++;
    } else {
      seenIds.add(rawId);
    }

    // 2. Date parsing
    const rawDate = getVal('date');
    let parsedDate = '';
    let year = 2024;
    let month = 1;

    if (!rawDate) {
      parsedDate = '2024-01-01';
      rowWarnings.push('Invalid or empty date; defaulted to 2024-01-01.');
      issues.push({
        row: rowNum,
        transactionId: rawId,
        type: 'invalid_date',
        message: 'Date field empty; defaulted to 2024-01-01.',
        severity: 'warning',
      });
      totalWarnings++;
    } else {
      // Handle UK format DD/MM/YYYY or YYYY-MM-DD
      if (rawDate.includes('/')) {
        const parts = rawDate.split('/');
        if (parts.length === 3) {
          const d = parts[0].padStart(2, '0');
          const m = parts[1].padStart(2, '0');
          const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
          parsedDate = `${y}-${m}-${d}`;
          year = parseInt(y, 10) || 2024;
          month = parseInt(m, 10) || 1;
        }
      } else if (rawDate.includes('-')) {
        const parts = rawDate.split('-');
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            // YYYY-MM-DD
            parsedDate = rawDate;
            year = parseInt(parts[0], 10) || 2024;
            month = parseInt(parts[1], 10) || 1;
          } else {
            // DD-MM-YYYY
            parsedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            year = parseInt(parts[2], 10) || 2024;
            month = parseInt(parts[1], 10) || 1;
          }
        }
      }

      if (!parsedDate || isNaN(year) || isNaN(month)) {
        parsedDate = '2024-01-01';
        rowWarnings.push(`Unrecognised date format '${rawDate}'.`);
        issues.push({
          row: rowNum,
          transactionId: rawId,
          type: 'invalid_date',
          message: `Unrecognised date '${rawDate}'. Expected DD/MM/YYYY or YYYY-MM-DD.`,
          severity: 'warning',
        });
        totalWarnings++;
      }
    }

    // 3. Counterparty & Description
    const counterparty = getVal('counterparty') || 'Unknown Entity';
    const description = getVal('description') || `${counterparty} transaction`;

    // 4. Type classification
    const rawType = getVal('type').toLowerCase();
    let type: TransactionType = 'expense';
    if (rawType.includes('inc') || rawType.includes('rev') || rawType.includes('sale') || rawType.includes('credit')) {
      type = 'income';
    } else if (rawType.includes('loan') || rawType.includes('debt') || rawType.includes('facility')) {
      type = 'loan';
    } else if (rawType.includes('equity') || rawType.includes('invest') || rawType.includes('capital')) {
      type = 'equity';
    } else if (rawType.includes('transfer') || rawType.includes('contra')) {
      type = 'transfer';
    } else if (rawType.includes('exp') || rawType.includes('bill') || rawType.includes('cost') || rawType.includes('debit')) {
      type = 'expense';
    } else {
      // Default guess based on description
      if (description.toLowerCase().includes('subscription') || description.toLowerCase().includes('client')) {
        type = 'income';
      } else {
        type = 'expense';
      }
      rowWarnings.push(`Unclear transaction type '${rawType}'; categorised as ${type}.`);
      issues.push({
        row: rowNum,
        transactionId: rawId,
        type: 'unknown_type',
        message: `Unrecognised transaction type '${rawType}'. Defaulted to '${type}'.`,
        severity: 'warning',
      });
      totalWarnings++;
    }

    // 5. Category
    let category = getVal('category');
    if (!category) {
      category = type === 'income' ? 'General Revenue' : 'General Operating Expense';
      rowWarnings.push('Missing category; defaulted.');
      issues.push({
        row: rowNum,
        transactionId: rawId,
        type: 'unmapped_category',
        message: `Missing category on row ${rowNum}.`,
        severity: 'warning',
      });
      totalWarnings++;
    }

    // 6. Amounts & VAT reconciliation
    const cleanNumber = (val: string): number => {
      if (!val) return 0;
      const cleaned = val.replace(/[^0-9.-]/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    };

    let net = cleanNumber(getVal('netAmount'));
    let vat = cleanNumber(getVal('vatAmount'));
    let gross = cleanNumber(getVal('grossAmount'));

    if (net === 0 && gross !== 0) {
      if (vat !== 0) {
        net = gross - vat;
      } else {
        // Standard UK 20% VAT reverse calculation if gross given
        net = Math.round((gross / 1.2) * 100) / 100;
        vat = Math.round((gross - net) * 100) / 100;
      }
    } else if (gross === 0 && net !== 0) {
      gross = net + vat;
    }

    // VAT Consistency test
    if (net > 0 && vat > 0 && gross > 0) {
      const calculatedGross = Math.round((net + vat) * 100) / 100;
      if (Math.abs(calculatedGross - gross) > 0.05) {
        rowWarnings.push(`VAT discrepancy: Net (£${net}) + VAT (£${vat}) != Gross (£${gross}).`);
        issues.push({
          row: rowNum,
          transactionId: rawId,
          type: 'vat_mismatch',
          message: `VAT calculation variance: Net £${net} + VAT £${vat} = £${calculatedGross}, but Gross is £${gross}.`,
          severity: 'warning',
        });
        totalWarnings++;
      }
    }

    if (net <= 0 && gross <= 0) {
      rowWarnings.push('Zero or negative financial amount recorded.');
      issues.push({
        row: rowNum,
        transactionId: rawId,
        type: 'invalid_amount',
        message: `Row ${rowNum} has net amount of £0 or negative value.`,
        severity: 'warning',
      });
      totalWarnings++;
    }

    // 7. Payment status
    const rawStatus = getVal('status').toLowerCase();
    let status: PaymentStatus = 'paid';
    if (rawStatus.includes('unpaid') || rawStatus.includes('open') || rawStatus.includes('pending')) {
      status = 'unpaid';
    } else if (rawStatus.includes('overdue') || rawStatus.includes('late')) {
      status = 'overdue';
    } else {
      status = 'paid';
    }

    // 8. Recurring check
    const rawRec = getVal('isRecurring').toLowerCase();
    const isRecurring = rawRec === 'true' || rawRec === 'yes' || rawRec === '1' || rawRec.includes('recur');

    // 9. Potential Double Counting Check
    if (type === 'income') {
      const txDateObj = new Date(parsedDate);
      const potentialMatch = recentIncomeTracker.find(r => 
        r.counterparty.toLowerCase() === counterparty.toLowerCase() &&
        Math.abs(r.net - net) < 0.01 &&
        Math.abs(txDateObj.getTime() - r.date.getTime()) <= 3 * 24 * 60 * 60 * 1000
      );

      if (potentialMatch) {
        rowWarnings.push(`Potential double-count with Row ${potentialMatch.rowIdx} (£${net} from ${counterparty}).`);
        issues.push({
          row: rowNum,
          transactionId: rawId,
          type: 'potential_double_count',
          message: `Potential double counting: Same amount £${net} for '${counterparty}' within 3 days (matches row ${potentialMatch.rowIdx}).`,
          severity: 'warning',
        });
        totalWarnings++;
      } else {
        recentIncomeTracker.push({
          counterparty,
          net,
          date: txDateObj,
          rowIdx: rowNum,
        });
      }
    }

    transactions.push({
      id: rawId,
      date: parsedDate,
      invoiceDate: getVal('invoiceDate') || parsedDate,
      dueDate: getVal('dueDate'),
      paymentDate: getVal('paymentDate'),
      year,
      month,
      description,
      counterparty,
      type,
      category,
      netAmount: Math.round(net * 100) / 100,
      vatAmount: Math.round(vat * 100) / 100,
      grossAmount: Math.round(gross * 100) / 100,
      status,
      isRecurring,
      paymentMethod: getVal('paymentMethod') || 'Bank Transfer',
      isDuplicate,
      validationWarnings: rowWarnings.length > 0 ? rowWarnings : undefined,
      rawSource: row,
    });
  });

  return {
    transactions,
    issues,
    duplicateCount,
    totalErrors,
    totalWarnings,
  };
}
