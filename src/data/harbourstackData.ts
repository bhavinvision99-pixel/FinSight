import { Transaction } from '../types/financial';

/**
 * Combined synthetic 2024-2025 financial dataset for HarbourStack Software Ltd
 * UK B2B SaaS software provider with subscriptions, enterprise licenses, and operational overheads.
 */
export const HARBOURSTACK_COMPANY_NAME = "HarbourStack Software Ltd";

export function generateHarbourStackTransactions(): Transaction[] {
  const transactions: Transaction[] = [];

  // Helper to add transaction
  const addTx = (
    id: string,
    dateStr: string,
    counterparty: string,
    type: 'income' | 'expense' | 'loan' | 'equity' | 'transfer',
    category: string,
    description: string,
    net: number,
    vatRate: number,
    status: 'paid' | 'unpaid' | 'overdue' = 'paid',
    isRecurring: boolean = false,
    paymentMethod: string = 'BACS Bank Transfer'
  ) => {
    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const vat = Math.round(net * vatRate * 100) / 100;
    const gross = Math.round((net + vat) * 100) / 100;

    // Calculate due date (30 days) and payment date
    const d = new Date(dateStr);
    const dueDate = new Date(d);
    dueDate.setDate(dueDate.getDate() + 30);
    const dueStr = dueDate.toISOString().slice(0, 10);

    let paymentDate: string | undefined = undefined;
    if (status === 'paid') {
      const payD = new Date(d);
      payD.setDate(payD.getDate() + 14);
      paymentDate = payD.toISOString().slice(0, 10);
    }

    transactions.push({
      id,
      date: dateStr,
      invoiceDate: dateStr,
      dueDate: dueStr,
      paymentDate,
      year,
      month,
      description,
      counterparty,
      type,
      category,
      netAmount: Math.round(net * 100) / 100,
      vatAmount: vat,
      grossAmount: gross,
      status,
      isRecurring,
      paymentMethod,
    });
  };

  // Customers & MRR profiles
  const enterpriseClients = [
    { name: "Nexus Retail Systems Ltd", baseNet24: 5200, baseNet25: 6800, plan: "Enterprise SaaS Tier" },
    { name: "Apex Logistics Group", baseNet24: 4500, baseNet25: 5900, plan: "Enterprise Cloud License" },
    { name: "Vanguard Financial Analytics", baseNet24: 7800, baseNet25: 9500, plan: "Core Platform + API Access" },
    { name: "Horizon Media Global", baseNet24: 3600, baseNet25: 4400, plan: "Pro SaaS Subscription" },
    { name: "Cobalt Health Informatics", baseNet24: 6200, baseNet25: 8100, plan: "HIPAA Compliant Cloud Tier" },
    { name: "Strata Engineering UK", baseNet24: 2900, baseNet25: 3500, plan: "Standard Team Subscription" },
    { name: "Pinnacle Asset Partners", baseNet24: 4100, baseNet25: 5300, plan: "Enterprise Cloud License" },
  ];

  // 2024 & 2025 Months (1 to 12 each)
  const years = [2024, 2025];

  years.forEach(year => {
    for (let m = 1; m <= 12; m++) {
      const mm = m < 10 ? `0${m}` : `${m}`;
      const yearShort = year.toString().slice(2);

      // 1. Monthly Recurring Revenue (SaaS Subscriptions)
      enterpriseClients.forEach((client, idx) => {
        const base = year === 2024 ? client.baseNet24 : client.baseNet25;
        // modest seasonal ramp
        const monthlyVal = Math.round(base * (1 + (m - 1) * 0.015));
        const day = 3 + (idx * 3);
        const dd = day < 10 ? `0${day}` : `${day}`;
        const txId = `INV-${yearShort}${mm}-${client.name.substring(0, 3).toUpperCase()}${idx}`;
        
        // Let some late 2025 invoices be unpaid/pending for realistic accounts receivable
        let status: 'paid' | 'unpaid' | 'overdue' = 'paid';
        if (year === 2025 && m === 12 && idx >= 4) {
          status = 'unpaid';
        } else if (year === 2025 && m === 11 && idx === 6) {
          status = 'overdue';
        }

        addTx(
          txId,
          `${year}-${mm}-${dd}`,
          client.name,
          'income',
          'Software Subscription',
          `${client.plan} - Monthly Fee`,
          monthlyVal,
          0.20, // 20% VAT
          status,
          true,
          'Direct Debit'
        );
      });

      // 2. Professional Services & Implementation (Occasional enterprise onboarding)
      if (m === 2 || m === 5 || m === 9 || m === 11) {
        const client = enterpriseClients[(m + year) % enterpriseClients.length];
        const fee = year === 2024 ? 8500 : 12500;
        addTx(
          `PS-${yearShort}${mm}-01`,
          `${year}-${mm}-15`,
          client.name,
          'income',
          'Professional Services',
          `Custom Integration & Migration Consulting`,
          fee,
          0.20,
          'paid',
          false,
          'BACS Bank Transfer'
        );
      }

      // 3. Operating Expenses - Cloud Hosting (AWS & GCP)
      const awsNet = year === 2024 ? 3200 + m * 80 : 4400 + m * 110;
      addTx(
        `EXP-${yearShort}${mm}-AWS`,
        `${year}-${mm}-02`,
        'Amazon Web Services EMEA',
        'expense',
        'Cloud Hosting',
        'AWS Cloud Infrastructure & Database Hosting',
        awsNet,
        0.20,
        'paid',
        true,
        'Corporate Credit Card'
      );

      // GCP Backup & BigQuery
      addTx(
        `EXP-${yearShort}${mm}-GCP`,
        `${year}-${mm}-04`,
        'Google Cloud Ireland Ltd',
        'expense',
        'Cloud Hosting',
        'Google Cloud Data Analytics & Secondary Storage',
        year === 2024 ? 650 : 880,
        0.20,
        'paid',
        true,
        'Corporate Credit Card'
      );

      // 4. Operating Expenses - Salaries & Payroll (Gross salaries, zero VAT)
      // 2024 had 6 FTEs (~£23,500/mo net payroll), 2025 expanded to 8 FTEs (~£31,000/mo)
      const payrollAmount = year === 2024 ? 23500 + (m > 6 ? 1500 : 0) : 31200 + (m > 8 ? 2200 : 0);
      addTx(
        `PAY-${yearShort}${mm}-01`,
        `${year}-${mm}-28`,
        'HarbourStack Payroll Service Ltd',
        'expense',
        'Salaries & Payroll',
        'Monthly Employee Salaries & PAYE/NIC',
        payrollAmount,
        0.0, // Salaries are exempt from VAT
        'paid',
        true,
        'Faster Payments'
      );

      // 5. Software Licenses & Dev Tools
      addTx(
        `EXP-${yearShort}${mm}-GIT`,
        `${year}-${mm}-08`,
        'GitHub Inc / Microsoft UK',
        'expense',
        'Software Licences',
        'GitHub Enterprise Team Seats',
        year === 2024 ? 380 : 490,
        0.20,
        'paid',
        true,
        'Corporate Credit Card'
      );

      addTx(
        `EXP-${yearShort}${mm}-CRM`,
        `${year}-${mm}-10`,
        'HubSpot Ireland',
        'expense',
        'Software Licences',
        'HubSpot Marketing & CRM Enterprise',
        year === 2024 ? 1200 : 1450,
        0.20,
        'paid',
        true,
        'Corporate Credit Card'
      );

      // 6. Marketing & Lead Generation
      const adSpend = year === 2024 ? 2500 + (m % 3) * 300 : 3800 + (m % 3) * 450;
      addTx(
        `EXP-${yearShort}${mm}-MKT`,
        `${year}-${mm}-18`,
        'LinkedIn Marketing Solutions',
        'expense',
        'Marketing & Ads',
        'B2B SaaS LinkedIn & Google Search Ads',
        adSpend,
        0.20,
        'paid',
        true,
        'Corporate Credit Card'
      );

      // 7. Office Lease & Facilities (Shoreditch Tech Workspace)
      addTx(
        `EXP-${yearShort}${mm}-OFC`,
        `${year}-${mm}-01`,
        'Workspace Group PLC (Shoreditch)',
        'expense',
        'Office & Facilities',
        'Office Space Lease & High-Speed Fibre Connection',
        year === 2024 ? 2800 : 3100,
        0.20,
        'paid',
        true,
        'Direct Debit'
      );

      // 8. Legal, Accounting & Professional Fees
      if (m === 3 || m === 6 || m === 9 || m === 12) {
        addTx(
          `EXP-${yearShort}${mm}-ACC`,
          `${year}-${mm}-22`,
          'Elm & Partners Chartered Accountants',
          'expense',
          'Legal & Accounting',
          'Quarterly Management Accounts & Tax Filing Retainer',
          year === 2024 ? 1750 : 2100,
          0.20,
          'paid',
          false,
          'BACS Bank Transfer'
        );
      }
    }

    // Annual Hardware & Laptop Refresh in August
    addTx(
      `EXP-${year.toString().slice(2)}08-APP`,
      `${year}-08-14`,
      'Apple UK Enterprise Store',
      'expense',
      'Hardware & Equipment',
      'MacBook Pro M-Series Engineering Hardware Refresh',
      year === 2024 ? 4200 : 5800,
      0.20,
      'paid',
      false,
      'Corporate Credit Card'
    );
  });

  // 9. Non-operating items (to demonstrate accounting discipline: loans, equity)
  // Seed Seed Loan received in Jan 2024 - Non-operating!
  addTx(
    `NON-2401-LOAN`,
    `2024-01-15`,
    'British Business Bank (Startup Loan)',
    'loan',
    'Financing & Loans',
    'Government Backed Term Facility (Not Operating Income)',
    50000,
    0.0,
    'paid',
    false,
    'BACS Bank Transfer'
  );

  // Growth Capital Equity injection in June 2025
  addTx(
    `NON-2506-EQTY`,
    `2025-06-20`,
    'Apex Venture Partners UK',
    'equity',
    'Equity Investment',
    'Series Seed Extension Round (Not Operating Income)',
    150000,
    0.0,
    'paid',
    false,
    'BACS Bank Transfer'
  );

  return transactions;
}

/**
 * Converts transactions into standard CSV format for download and testing
 */
export function exportTransactionsToCSV(transactions: Transaction[]): string {
  const headers = [
    "Transaction ID",
    "Transaction Date",
    "Invoice Date",
    "Due Date",
    "Payment Date",
    "Financial Year",
    "Customer / Supplier",
    "Description",
    "Transaction Type",
    "Category",
    "Net Amount",
    "VAT Amount",
    "Gross Amount",
    "Payment Status",
    "Recurring",
    "Payment Method"
  ];

  const rows = transactions.map(t => [
    `"${t.id}"`,
    `"${t.date}"`,
    `"${t.invoiceDate || ''}"`,
    `"${t.dueDate || ''}"`,
    `"${t.paymentDate || ''}"`,
    t.year,
    `"${t.counterparty.replace(/"/g, '""')}"`,
    `"${t.description.replace(/"/g, '""')}"`,
    `"${t.type}"`,
    `"${t.category.replace(/"/g, '""')}"`,
    t.netAmount.toFixed(2),
    t.vatAmount.toFixed(2),
    t.grossAmount.toFixed(2),
    `"${t.status}"`,
    t.isRecurring ? "TRUE" : "FALSE",
    `"${t.paymentMethod || ''}"`
  ]);

  return [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
}
