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

@Injectable()
export class CashService {
  constructor(
    @InjectModel(CashTransaction)
    private readonly transactionModel: typeof CashTransaction,

    @InjectModel(CashOpening)
    private readonly openingModel: typeof CashOpening,

    @InjectModel(CashAdjustment)
    private readonly adjustmentModel: typeof CashAdjustment,

    private readonly auditService: AuditService,
  ) {}

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
    const opening = await this.openingModel.create({
      ...dto,
      enteredBy: userId,
    } as any);

    await this.auditService.log({
      userId,
      action: 'CREATE',
      tableName: 'cash_openings',
      recordId: opening.id,
      newValue: opening.toJSON(),
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
    const adjustment = await this.adjustmentModel.create({
      ...dto,
      addedBy: userId,
    } as any);

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
