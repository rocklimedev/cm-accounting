import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PaymentMode } from '../bank/models/payment-mode.model';
import { ExpenseItem } from '../expense/models/expense-item.model';
import { DebtorEntry } from '@/modules/debtor/models/debtor-entries.model';
import {
  PaymentModeReportFilterDto,
  PaymentModeReportItem,
} from './dto/payment-mode-report.dto';
import { Op } from 'sequelize';

@Injectable()
export class ReconciliationService {
  constructor(
    @InjectModel(PaymentMode) private paymentModeModel: typeof PaymentMode,
    @InjectModel(ExpenseItem) private expenseItemModel: typeof ExpenseItem,
    @InjectModel(DebtorEntry) private debtorEntryModel: typeof DebtorEntry,
  ) {}

  async generatePaymentModeReport(
    filters: PaymentModeReportFilterDto,
  ): Promise<PaymentModeReportItem[]> {
    const where: any = {};

    if (filters.from || filters.to) {
      where.created_at = {};
      if (filters.from) where.created_at[Op.gte] = filters.from;
      if (filters.to) where.created_at[Op.lte] = filters.to;
    }

    // Get all active payment modes (or include inactive if requested)
    const paymentModes = await this.paymentModeModel.findAll({
      where: filters.includeInactive ? {} : { is_active: true },
      order: [['name', 'ASC']],
    });

    const report: PaymentModeReportItem[] = [];

    for (const pm of paymentModes) {
      // Expenses by payment mode
      const expenses = await this.expenseItemModel.sum('amount', {
        where: {
          payment_mode_id: pm.id,
          ...(filters.from || filters.to
            ? { created_at: where.created_at }
            : {}),
        },
      });

      // Debtor Entries
      const debtorEntries = await this.debtorEntryModel.findAll({
        where: {
          paymentModeId: pm.id,
          ...(filters.from || filters.to
            ? { created_at: where.created_at }
            : {}),
        },
        attributes: ['entryType', 'amount'],
      });

      const totalDebtorReceived = debtorEntries
        .filter((e) => e.entryType === 'debtor_received')
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const totalNewDebtors = debtorEntries
        .filter((e) => e.entryType === 'new_debtor')
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const totalExpensesNum = Number(expenses || 0);

      report.push({
        paymentModeId: pm.id,
        paymentModeName: pm.name,
        paymentModeCode: pm.code,
        totalExpenses: totalExpensesNum,
        totalDebtorReceived,
        totalNewDebtors,
        netAmount: totalDebtorReceived - totalExpensesNum,
        transactionCount: debtorEntries.length + (expenses ? 1 : 0), // rough count
      });
    }

    return report;
  }
}
