import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { DailyClosing } from './models/daily-closing.model';
import { SalesReport } from '../sales/models/sales-report.model';
import { ExpenseReport } from '../expense/models/expense-report.model';
import { DebtorTransaction } from '../debtor/models/debtor-transaction.model';
import { CryptoService } from '../crypto/crypto.service';
import { AuditService } from '../audit/audit.service';
import { CreateDailyClosingDto } from './dto/create-daily-closing.dto';
import { PaymentLedgerService } from '../payment-ledger/payment-ledger.service';

@Injectable()
export class DailyClosingService {
  constructor(
    @InjectModel(DailyClosing) private model: typeof DailyClosing,
    @InjectModel(SalesReport) private salesModel: typeof SalesReport,
    @InjectModel(ExpenseReport) private expenseModel: typeof ExpenseReport,
    @InjectModel(DebtorTransaction)
    private debtorModel: typeof DebtorTransaction,
    private crypto: CryptoService,
    private auditService: AuditService,
    private paymentLedgerService: PaymentLedgerService,
  ) {}

  findAll() {
    return this.model.findAll({ order: [['report_date', 'DESC']] });
  }

  async findOne(report_date: string) {
    const closing = await this.model.findOne({ where: { report_date } });
    if (!closing)
      throw new NotFoundException('Daily closing not found for that date');
    return closing;
  }

  async closeDay(dto: CreateDailyClosingDto, userId: string) {
    const existing = await this.model.findOne({
      where: { report_date: dto.report_date },
    });
    if (existing) {
      throw new BadRequestException('Day already closed for this date');
    }

    const [salesSum, expenseSum, paymentSummary, debtorRows] = await Promise.all([
      this.salesModel.sum('gross_amount', {
        where: { report_date: dto.report_date, status: 'POSTED' },
      }),
      this.expenseModel.sum('total_amount', {
        where: { report_date: dto.report_date, status: 'POSTED' },
      }),
      this.paymentLedgerService.getMovementSummary({
        from: dto.report_date,
        to: dto.report_date,
      }),
      this.debtorModel.findAll({
        where: {
          created_at: {
            [Op.between]: [
              new Date(`${dto.report_date}T00:00:00.000Z`),
              new Date(`${dto.report_date}T23:59:59.999Z`),
            ],
          },
        },
      }),
    ]);

    const cash_total = paymentSummary.reduce(
      (sum, mode) => sum + Number(mode.netAmount || 0),
      0,
    );
    const debtor_total = debtorRows.reduce(
      (sum, tx) =>
        sum + (tx.type === 'PAYMENT' ? -Number(tx.amount) : Number(tx.amount)),
      0,
    );

    const sales_total = salesSum ?? 0;
    const expense_total = expenseSum ?? 0;

    const previous = await this.model.findOne({
      order: [['report_date', 'DESC']],
    });

    const hash = this.crypto.chainHash(previous?.hash ?? null, {
      report_date: dto.report_date,
      sales_total,
      expense_total,
      cash_total,
      debtor_total,
    });

    const closing = await this.model.create({
      report_date: dto.report_date,
      sales_total,
      expense_total,
      cash_total,
      debtor_total,
      hash,
    } as any);

    await this.auditService.log({
      userId,
      action: 'DAY_CLOSE',
      tableName: 'daily_closing',
      recordId: closing.id,
      newValue: closing.toJSON(),
    });

    return closing;
  }

  /** Re-walks the whole chain to confirm no row has been tampered with. */
  async verifyChain() {
    const rows = await this.model.findAll({ order: [['report_date', 'ASC']] });
    let previousHash: string | null = null;
    for (const row of rows) {
      const expected = this.crypto.chainHash(previousHash, {
        report_date: row.report_date,
        sales_total: row.sales_total,
        expense_total: row.expense_total,
        cash_total: row.cash_total,
        debtor_total: row.debtor_total,
      });
      if (expected !== row.hash) {
        return { valid: false, brokenAt: row.report_date };
      }
      previousHash = row.hash;
    }
    return { valid: true };
  }
}
