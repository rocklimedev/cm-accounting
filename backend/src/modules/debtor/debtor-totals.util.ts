import { DebtorEntry } from './models/debtor-entries.model';
import { DebtorReport } from './models/debtor-reports.model';

export interface DebtorTotals {
  openingAmount: number;
  newDebtorTotal: number;
  receivedTotal: number;
  closingAmount: number;
}

/**
 * Derives opening/new/received/closing totals for a debtor report from its
 * entries. Debtor reports are append-only (adjustments happen via new
 * DebtorEntry rows, never by updating/deleting existing rows or the report's
 * own amount columns), so these totals must always be computed from the
 * entries at read time rather than trusted from stored columns.
 */
export function computeDebtorTotals(report: DebtorReport): DebtorTotals {
  const entries: DebtorEntry[] = (report as any).entries ?? [];

  let newDebtorTotal = 0;
  let receivedTotal = 0;

  for (const entry of entries) {
    const amount = parseFloat(entry.amount as any) || 0;

    if (entry.entryType === 'new_debtor') {
      newDebtorTotal += amount;
    } else {
      receivedTotal += amount;
    }
  }

  const openingAmount = parseFloat(report.openingAmount as any) || 0;
  const closingAmount = openingAmount + newDebtorTotal - receivedTotal;

  return { openingAmount, newDebtorTotal, receivedTotal, closingAmount };
}
