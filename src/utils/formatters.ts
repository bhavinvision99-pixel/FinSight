/**
 * FinSight Currency and UK formatting utilities
 */

export function formatGBP(amount: number, compact: boolean = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '£0.00';

  if (compact) {
    if (Math.abs(amount) >= 1_000_000) {
      return `£${(amount / 1_000_000).toFixed(2)}m`;
    }
    if (Math.abs(amount) >= 1_000) {
      return `£${(amount / 1_000).toFixed(1)}k`;
    }
  }

  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatGBPExact(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(1)}%`;
}

export function formatUKDate(dateStr: string): string {
  if (!dateStr || dateStr === '-') return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}
