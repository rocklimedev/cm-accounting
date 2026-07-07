import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';
import { PaymentMode } from '@/modules/bank/models/payment-mode.model';
import {
  PaymentLedgerEntry,
  PaymentLedgerFlowType,
} from './models/payment-ledger-entry.model';

export interface PaymentLedgerMovement {
  entryDate: string;
  paymentModeId: string;
  flowType: PaymentLedgerFlowType;
  amount: number;
  sourceType: string;
  sourceId: string;
  description?: string;
  createdBy?: string;
}

@Injectable()
export class PaymentLedgerService {
  constructor(
    @InjectModel(PaymentLedgerEntry)
    private readonly ledgerModel: typeof PaymentLedgerEntry,
  ) {}

  async recordOpening(
    movement: Omit<PaymentLedgerMovement, 'flowType'>,
    transaction?: Transaction,
  ) {
    const existingOpening = await this.ledgerModel.findOne({
      where: {
        paymentModeId: movement.paymentModeId,
        flowType: PaymentLedgerFlowType.OPENING,
      },
      transaction,
    });

    if (existingOpening) {
      throw new BadRequestException(
        'Opening already exists for this payment mode',
      );
    }

    const earlierMovement = await this.ledgerModel.findOne({
      where: {
        paymentModeId: movement.paymentModeId,
      },
      transaction,
    });

    if (earlierMovement) {
      throw new BadRequestException(
        'Opening must be the first transaction for this payment mode',
      );
    }

    return this.recordMovement(
      { ...movement, flowType: PaymentLedgerFlowType.OPENING },
      transaction,
      false,
    );
  }

  async recordMovement(
    movement: PaymentLedgerMovement,
    transaction?: Transaction,
    requireOpening = true,
  ) {
    const amount = Number(movement.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Payment ledger amount must be positive');
    }

    const existing = await this.ledgerModel.findOne({
      where: {
        sourceType: movement.sourceType,
        sourceId: movement.sourceId,
        paymentModeId: movement.paymentModeId,
        flowType: movement.flowType,
      },
      transaction,
    });

    if (existing) {
      return existing;
    }

    if (requireOpening) {
      await this.ensureOpeningExists(
        movement.paymentModeId,
        movement.entryDate,
        movement.createdBy,
        transaction,
      );
    }

    return this.ledgerModel.create(
      {
        ...movement,
        amount,
      } as any,
      { transaction },
    );
  }

  /**
   * Ensures an OPENING entry exists for this payment mode as of entryDate.
   *
   * - If an opening dated on/before entryDate already exists, does nothing.
   * - If no opening exists at all, auto-creates a zero-balance opening dated
   *   to entryDate, so a payment mode becomes usable the first time it's
   *   actually posted against, without requiring a manual setup step.
   * - If an opening exists but is dated AFTER entryDate, this is a genuine
   *   backdating conflict (e.g. someone is posting a report for a date
   *   before the mode's recorded opening) — that needs a human decision,
   *   so it still throws rather than silently creating a second opening
   *   row (which would corrupt getBalances()/getMovementSummary() totals).
   */
  async ensureOpeningExists(
    paymentModeId: string,
    entryDate: string,
    createdBy?: string,
    transaction?: Transaction,
  ) {
    const opening = await this.ledgerModel.findOne({
      where: {
        paymentModeId,
        flowType: PaymentLedgerFlowType.OPENING,
        entryDate: { [Op.lte]: entryDate },
      },
      transaction,
    });

    if (opening) {
      return opening;
    }

    const anyOpening = await this.ledgerModel.findOne({
      where: {
        paymentModeId,
        flowType: PaymentLedgerFlowType.OPENING,
      },
      transaction,
    });

    if (anyOpening) {
      throw new BadRequestException(
        `This payment mode's opening balance is dated ${anyOpening.entryDate}, ` +
          `which is after ${entryDate}. Backdate the opening balance or use a later entry date.`,
      );
    }

    return this.ledgerModel.create(
      {
        paymentModeId,
        entryDate,
        flowType: PaymentLedgerFlowType.OPENING,
        amount: 0,
        sourceType: 'AUTO_OPENING',
        sourceId: paymentModeId,
        description: 'Auto-created opening balance (0.00)',
        createdBy,
      } as any,
      { transaction },
    );
  }

  async getBalances(asOfDate?: string) {
    const entries = await this.ledgerModel.findAll({
      where: asOfDate ? { entryDate: { [Op.lte]: asOfDate } } : {},
      include: [{ model: PaymentMode }],
      order: [['entryDate', 'ASC']],
    });

    const balances = new Map<string, any>();

    for (const entry of entries) {
      const key = entry.paymentModeId;
      const existing = balances.get(key) ?? {
        paymentModeId: entry.paymentModeId,
        paymentModeName: entry.paymentMode?.name ?? entry.paymentModeId,
        paymentModeCode: entry.paymentMode?.code ?? entry.paymentModeId,
        opening: 0,
        totalIn: 0,
        totalOut: 0,
        balance: 0,
      };

      const amount = Number(entry.amount);
      if (entry.flowType === PaymentLedgerFlowType.OPENING) {
        existing.opening += amount;
        existing.balance += amount;
      } else if (entry.flowType === PaymentLedgerFlowType.IN) {
        existing.totalIn += amount;
        existing.balance += amount;
      } else {
        existing.totalOut += amount;
        existing.balance -= amount;
      }

      balances.set(key, existing);
    }

    return [...balances.values()];
  }

  async getMovementSummary(filters: {
    from?: string;
    to?: string;
    paymentModeId?: string;
  }) {
    const where: any = {};

    if (filters.from || filters.to) {
      where.entryDate = {};
      if (filters.from) where.entryDate[Op.gte] = filters.from;
      if (filters.to) where.entryDate[Op.lte] = filters.to;
    }

    if (filters.paymentModeId) {
      where.paymentModeId = filters.paymentModeId;
    }

    const entries = await this.ledgerModel.findAll({
      where,
      include: [{ model: PaymentMode }],
      order: [['entryDate', 'ASC']],
    });

    const summaries = new Map<string, any>();

    for (const entry of entries) {
      const key = entry.paymentModeId;
      const summary = summaries.get(key) ?? {
        paymentModeId: entry.paymentModeId,
        paymentModeName: entry.paymentMode?.name ?? entry.paymentModeId,
        paymentModeCode: entry.paymentMode?.code ?? entry.paymentModeId,
        opening: 0,
        totalIn: 0,
        totalOut: 0,
        totalSales: 0,
        totalExpenses: 0,
        totalDebtorReceived: 0,
        totalAdjustments: 0,
        netAmount: 0,
        transactionCount: 0,
      };

      const amount = Number(entry.amount);

      if (entry.flowType === PaymentLedgerFlowType.OPENING) {
        summary.opening += amount;
        summary.netAmount += amount;
      } else if (entry.flowType === PaymentLedgerFlowType.IN) {
        summary.totalIn += amount;
        summary.netAmount += amount;
      } else {
        summary.totalOut += amount;
        summary.netAmount -= amount;
      }

      if (entry.sourceType === 'SALES_REPORT') {
        summary.totalSales += amount;
      } else if (entry.sourceType === 'EXPENSE_REPORT') {
        summary.totalExpenses += amount;
      } else if (entry.sourceType === 'DEBTOR_RECEIVED') {
        summary.totalDebtorReceived += amount;
      } else if (entry.sourceType === 'CASH_ADJUSTMENT') {
        summary.totalAdjustments +=
          entry.flowType === PaymentLedgerFlowType.IN ? amount : -amount;
      }

      summary.transactionCount += 1;
      summaries.set(key, summary);
    }

    return [...summaries.values()];
  }
}
