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
      await this.assertOpeningExists(
        movement.paymentModeId,
        movement.entryDate,
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

  async assertOpeningExists(
    paymentModeId: string,
    entryDate: string,
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

    if (!opening) {
      throw new BadRequestException(
        'Create opening balance for this payment mode before posting transactions',
      );
    }
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
