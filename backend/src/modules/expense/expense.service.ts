import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { ExpenseReport, ReportStatus } from './models/expense-report.model';
import { ExpenseItem } from './models/expense-item.model';
import { CreateExpenseReportDto } from './dto/create-expense-report.dto';
import { CryptoService } from '../crypto/crypto.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectModel(ExpenseReport) private reportModel: typeof ExpenseReport,
    @InjectModel(ExpenseItem) private itemModel: typeof ExpenseItem,
    private sequelize: Sequelize,
    private crypto: CryptoService,
    private auditService: AuditService,
  ) {}

  async findAll() {
    const reports = await this.reportModel.findAll({
      include: [ExpenseItem],
      order: [['report_date', 'DESC']],
    });
    return reports.map((r) => this.toSafeJson(r));
  }

  async findOne(id: string) {
    const report = await this.reportModel.findByPk(id, {
      include: [ExpenseItem],
    });
    if (!report) throw new NotFoundException('Expense report not found');
    return this.toSafeJson(report);
  }

  private toSafeJson(report: ExpenseReport) {
    const json: any = report.toJSON();
    json.items = (json.items ?? []).map((item: any) => {
      const remarks = this.crypto.decrypt({
        cipher: item.remarks_cipher,
        iv: item.remarks_iv,
        tag: item.remarks_tag,
      });
      const { remarks_cipher, remarks_iv, remarks_tag, ...rest } = item;
      return { ...rest, remarks };
    });

    const verified = json.hmac_signature
      ? this.crypto.verify(
          {
            report_date: json.report_date,
            total_amount: json.total_amount,
            previous_hash: json.previous_hash,
          },
          json.hmac_signature,
        )
      : null;

    return { ...json, integrity_verified: verified };
  }

  async create(dto: CreateExpenseReportDto, userId: string) {
    const total_amount = dto.items.reduce((sum, i) => sum + i.amount, 0);

    const lastPosted = await this.reportModel.findOne({
      where: { status: ReportStatus.POSTED },
      order: [['created_at', 'DESC']],
    });
    const previous_hash = this.crypto.chainHash(
      lastPosted?.previous_hash ?? null,
      {
        id: lastPosted?.id ?? null,
        report_date: lastPosted?.report_date ?? null,
        total_amount: lastPosted?.total_amount ?? null,
      },
    );

    const hmac_signature = this.crypto.sign({
      report_date: dto.report_date,
      total_amount,
      previous_hash,
    });

    const result = await this.sequelize.transaction(async (t) => {
      const report = await this.reportModel.create(
        {
          report_date: dto.report_date,
          total_amount,
          hmac_signature,
          previous_hash,
          status: ReportStatus.DRAFT,
        } as any,
        { transaction: t },
      );

      for (const item of dto.items) {
        const encrypted = item.remarks
          ? this.crypto.encrypt(item.remarks)
          : { cipher: null, iv: null, tag: null };

        await this.itemModel.create(
          {
            expense_report_id: report.id,
            expense_title: item.expense_title,
            amount: item.amount,
            payment_mode: item.payment_mode,
            remarks_cipher: encrypted.cipher,
            remarks_iv: encrypted.iv,
            remarks_tag: encrypted.tag,
          } as any,
          { transaction: t },
        );
      }

      return report;
    });

    await this.auditService.log({
      userId,
      action: 'CREATE',
      tableName: 'expense_reports',
      recordId: result.id,
      newValue: {
        report_date: dto.report_date,
        total_amount,
        item_count: dto.items.length,
      },
    });

    return this.findOne(result.id);
  }

  async post(id: string, userId: string) {
    const report = await this.reportModel.findByPk(id);
    if (!report) throw new NotFoundException('Expense report not found');
    if (report.status !== ReportStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT reports can be posted');
    }
    const before = report.status;
    report.status = ReportStatus.POSTED;
    await report.save();

    await this.auditService.log({
      userId,
      action: 'POST',
      tableName: 'expense_reports',
      recordId: report.id,
      oldValue: { status: before },
      newValue: { status: report.status },
    });

    return this.findOne(id);
  }

  async voidReport(id: string, userId: string) {
    const report = await this.reportModel.findByPk(id);
    if (!report) throw new NotFoundException('Expense report not found');
    const before = report.status;
    report.status = ReportStatus.VOID;
    await report.save();

    await this.auditService.log({
      userId,
      action: 'VOID',
      tableName: 'expense_reports',
      recordId: report.id,
      oldValue: { status: before },
      newValue: { status: report.status },
    });

    return this.findOne(id);
  }
}
