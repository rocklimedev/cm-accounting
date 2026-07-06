import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { CashOpening } from './models/cash-openings.model';
import { CashAdjustment } from './models/cash-adjustments.model';

import { CreateCashTransactionDto } from './dto/create-cash-transaction.dto';
import { CreateCashOpeningDto } from './dto/create-cash-opening.dto';
import { CreateCashAdjustmentDto } from './dto/create-cash-adjustment.dto';
import { CashTransaction, FlowType } from './models/cash-transaction.model';
import { AuditService } from '../audit/audit.service';
import { PaymentLedgerService } from '../payment-ledger/payment-ledger.service';
import { PaymentLedgerFlowType } from '../payment-ledger/models/payment-ledger-entry.model';
import { PaymentMode } from '../bank/models/payment-mode.model';
@Injectable()
export class CashService {
  constructor(
    @InjectModel(CashTransaction)
    private readonly transactionModel: typeof CashTransaction,

    @InjectModel(CashOpening)
    private readonly openingModel: typeof CashOpening,

    @InjectModel(CashAdjustment)
    private readonly adjustmentModel: typeof CashAdjustment,

    @InjectModel(PaymentMode)
    private readonly paymentModeModel: typeof PaymentMode,

    private readonly auditService: AuditService,
    private readonly paymentLedgerService: PaymentLedgerService,
  ) {}
  private async getCashPaymentModeId(): Promise<string> {
    const cash = await this.paymentModeModel.findOne({
      where: {
        code: 'CASH',
        is_active: true,
      },
    });

    if (!cash) {
      throw new NotFoundException('Cash payment mode not found');
    }

    return cash.id;
  }
  // =====================================
  // Cash Transactions
  // =====================================

  async findAll() {
    return this.transactionModel.findAll({
      order: [['created_at', 'DESC']],
    });
  }

  async findOne(id: string) {
    const transaction = await this.transactionModel.findByPk(id);

    if (!transaction) {
      throw new NotFoundException('Cash transaction not found');
    }

    return transaction;
  }

  async createTransaction(dto: CreateCashTransactionDto, userId: string) {
    const transaction = await this.transactionModel.create(dto as any);

    await this.auditService.log({
      userId,
      action: 'CREATE',
      tableName: 'cash_transactions',
      recordId: transaction.id,
      newValue: transaction.toJSON(),
    });

    return transaction;
  }

  // =====================================
  // Cash Opening
  // =====================================

  async createCashOpening(dto: CreateCashOpeningDto, userId: string) {
    const paymentModeId = await this.getCashPaymentModeId();

    const opening = await this.openingModel.create({
      ...dto,
      paymentModeId,
      enteredBy: userId,
    } as any);

    await this.paymentLedgerService.recordOpening({
      entryDate: dto.openingDate,
      paymentModeId,
      amount: dto.amount,
      sourceType: 'CASH_OPENING',
      sourceId: opening.id,
      description: dto.reason || 'Opening balance',
      createdBy: userId,
    });

    return opening;
  }

  async getOpening(date: string) {
    return this.openingModel.findOne({
      where: {
        openingDate: date,
      },
    });
  }

  async getLatestOpening() {
    return this.openingModel.findOne({
      order: [['openingDate', 'DESC']],
    });
  }

  // =====================================
  // Cash Adjustments
  // =====================================

  async createCashAdjustment(dto: CreateCashAdjustmentDto, userId: string) {
    const paymentModeId = await this.getCashPaymentModeId();

    const adjustment = await this.adjustmentModel.create({
      ...dto,
      paymentModeId,
      addedBy: userId,
    } as any);
    await this.paymentLedgerService.recordMovement({
      entryDate: dto.adjustmentDate,
      paymentModeId,
      flowType:
        dto.type === 'add'
          ? PaymentLedgerFlowType.IN
          : PaymentLedgerFlowType.OUT,
      amount: dto.amount,
      sourceType: 'CASH_ADJUSTMENT',
      sourceId: adjustment.id,
      description: dto.reason,
      createdBy: userId,
    });

    await this.auditService.log({
      userId,
      action: 'CREATE',
      tableName: 'cash_adjustments',
      recordId: adjustment.id,
      newValue: adjustment.toJSON(),
    });

    return adjustment;
  }

  async getAdjustments(date: string) {
    return this.adjustmentModel.findAll({
      where: {
        adjustmentDate: date,
      },
      order: [['created_at', 'ASC']],
    });
  }

  // =====================================
  // Daily Cash Summary
  // =====================================

  async getDailySummary(date: string) {
    const opening = await this.openingModel.findOne({
      where: {
        openingDate: date,
      },
    });

    const adjustments = await this.adjustmentModel.findAll({
      where: {
        adjustmentDate: date,
      },
      order: [['created_at', 'ASC']],
    });

    const transactions = await this.transactionModel.findAll({
      where: {
        created_at: {
          [Op.between]: [`${date} 00:00:00`, `${date} 23:59:59`],
        },
      },
      order: [['created_at', 'ASC']],
    });

    let adjustmentTotal = 0;

    adjustments.forEach((adjustment) => {
      if (adjustment.type === 'add') {
        adjustmentTotal += Number(adjustment.amount);
      } else {
        adjustmentTotal -= Number(adjustment.amount);
      }
    });

    let income = 0;
    let expense = 0;

    transactions.forEach((transaction) => {
      if (transaction.type === FlowType.IN) {
        income += Number(transaction.amount);
      } else if (transaction.type === FlowType.OUT) {
        expense += Number(transaction.amount);
      }
    });

    const openingAmount = Number(opening?.amount ?? 0);

    const closing = openingAmount + adjustmentTotal + income - expense;

    return {
      date,
      opening,
      adjustments,
      transactions,
      openingAmount,
      adjustmentTotal,
      income,
      expense,
      closing,
    };
  }
}
