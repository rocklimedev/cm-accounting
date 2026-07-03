import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { DebtorTransaction } from './models/debtor-transaction.model';
import { DebtorReport } from './models/debtor-reports.model';
import { DebtorEntry } from './models/debtor-entries.model';

import { CreateDebtorTransactionDto } from './dto/create-debtor-transaction.dto';
import { CreateDebtorReportDto } from './dto/create-debtor-report.dto';
import { CreateDebtorEntryDto } from './dto/create-debtor-entry.dto';
import { PaymentMode } from '../bank/models/payment-mode.model';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class DebtorService {
  constructor(
    @InjectModel(DebtorTransaction)
    private readonly transactionModel: typeof DebtorTransaction,

    @InjectModel(DebtorReport)
    private readonly reportModel: typeof DebtorReport,

    @InjectModel(DebtorEntry)
    private readonly entryModel: typeof DebtorEntry,

    @InjectModel(PaymentMode)
    private readonly paymentModeModel: typeof PaymentMode,

    private readonly auditService: AuditService,
  ) {}

  // =====================================
  // Transactions
  // =====================================

  async findAll(customer_name?: string) {
    const where: any = {};

    return this.transactionModel.findAll({
      where,
      order: [['created_at', 'DESC']],
    });
  }

  async findOne(id: string) {
    const transaction = await this.transactionModel.findByPk(id);

    if (!transaction) {
      throw new NotFoundException('Debtor transaction not found');
    }

    return transaction;
  }

  async getBalance(customer_name: string) {
    const transactions = await this.transactionModel.findAll({
      where: { customer_name },
    });

    const balance = transactions.reduce((sum, tx) => {
      const amount = Number(tx.amount);

      if (tx.type === 'PAYMENT') {
        return sum - amount;
      }

      return sum + amount;
    }, 0);

    return { customer_name, balance };
  }

  async createTransaction(dto: CreateDebtorTransactionDto, userId: string) {
    const transaction = await this.transactionModel.create(dto as any);

    await this.auditService.log({
      userId,
      action: 'CREATE',
      tableName: 'debtor_transactions',
      recordId: transaction.id,
      newValue: transaction.toJSON(),
    });

    return transaction;
  }

  // =====================================
  // Reports
  // =====================================

  async createReport(dto: CreateDebtorReportDto, userId: string) {
    const report = await this.reportModel.create({
      ...dto,
      submittedBy: userId,
    } as any);

    await this.auditService.log({
      userId,
      action: 'CREATE',
      tableName: 'debtor_reports',
      recordId: report.id,
      newValue: report.toJSON(),
    });

    return report;
  }

  async getReport(report_date: string) {
    return this.reportModel.findOne({
      where: {
        reportDate: report_date,
      },
      include: [
        {
          model: DebtorEntry,
          include: [PaymentMode],
          required: false,
        },
      ],
    });
  }
  async getLatestReport() {
    return this.reportModel.findAll({
      include: [
        {
          model: DebtorEntry,
          include: [PaymentMode],
        },
      ],
      order: [['report_date', 'DESC']], // ✅ FIXED
    });
  }

  // =====================================
  // Entries
  // =====================================

  async createEntry(dto: CreateDebtorEntryDto, userId: string) {
    const paymentMode = await this.paymentModeModel.findOne({
      where: {
        id: dto.paymentModeId,
        is_active: true,
      },
    });

    if (!paymentMode) {
      throw new NotFoundException('Invalid payment mode');
    }

    const entry = await this.entryModel.create(dto as any);

    await this.auditService.log({
      userId,
      action: 'CREATE',
      tableName: 'debtor_entries',
      recordId: entry.id,
      newValue: entry.toJSON(),
    });

    return entry;
  }

  async getEntries(reportId: string) {
    return this.entryModel.findAll({
      where: {
        debtorReportId: reportId,
      },
      include: [PaymentMode],
      order: [['id', 'ASC']],
    });
  }

  // =====================================
  // Summary
  // =====================================

  async getReportSummary(report_date: string) {
    const report = await this.reportModel.findOne({
      where: {
        reportDate: report_date,
      },
      include: [
        {
          model: DebtorEntry,
          include: [PaymentMode],
          required: false,
        },
      ],
    });

    if (!report) {
      throw new NotFoundException('Debtor report not found');
    }

    const entries = report.entries ?? [];

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

    return {
      report,
      openingAmount,
      newDebtorTotal,
      receivedTotal,
      closingAmount,
    };
  }
}
