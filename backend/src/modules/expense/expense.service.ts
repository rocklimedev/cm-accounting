import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';

import { ExpenseReport, ReportStatus } from './models/expense-report.model';
import { ExpenseItem } from './models/expense-item.model';
import { ExpenseTitle } from './models/expense-titles.model';
import { PaymentMode } from '../bank/models/payment-mode.model';
import { User } from '../users/models/user.model';

import { CreateExpenseReportDto } from './dto/create-expense-report.dto';
import { CreateExpenseTitleDto } from './dto/create-expense-title.dto';

import { CryptoService } from '../crypto/crypto.service';
import { AuditService } from '../audit/audit.service';
import { DocumentNumberHelper } from '@/common/helper/document-number.helper';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectModel(ExpenseReport)
    private reportModel: typeof ExpenseReport,

    @InjectModel(ExpenseItem)
    private itemModel: typeof ExpenseItem,

    @InjectModel(ExpenseTitle)
    private titleModel: typeof ExpenseTitle,

    @InjectModel(PaymentMode)
    private paymentModeModel: typeof PaymentMode,

    private sequelize: Sequelize,
    private crypto: CryptoService,
    private auditService: AuditService,
  ) {}

  // =====================================
  // GET ALL
  // =====================================
  async findAll() {
    const reports = await this.reportModel.findAll({
      include: [
        {
          model: ExpenseItem,
          include: [PaymentMode],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['report_date', 'DESC']],
    });

    return reports.map((r) => this.toSafeJson(r));
  }

  // =====================================
  // GET ONE
  // =====================================
  async findOne(id: string) {
    const report = await this.reportModel.findByPk(id, {
      include: [
        {
          model: ExpenseItem,
          include: [PaymentMode],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!report) {
      throw new NotFoundException('Expense report not found');
    }

    return this.toSafeJson(report);
  }

  // =====================================
  // SAFE RESPONSE TRANSFORM
  // =====================================
  private toSafeJson(report: ExpenseReport) {
    const json: any = report.toJSON();

    // decrypt items
    json.items = (json.items ?? []).map((item: any) => {
      const remarks = this.crypto.decrypt({
        cipher: item.remarks_cipher,
        iv: item.remarks_iv,
        tag: item.remarks_tag,
      });

      const {
        remarks_cipher,
        remarks_iv,
        remarks_tag,
        payment_mode_id,
        paymentMode,
        ...rest
      } = item;

      return {
        ...rest,
        payment_mode: paymentMode
          ? {
              id: paymentMode.id,
              code: paymentMode.code,
              name: paymentMode.name,
            }
          : null,
        remarks,
      };
    });

    // attach creator
    json.created_by_user = json.creator
      ? {
          id: json.creator.id,
          name: json.creator.name,
          email: json.creator.email,
        }
      : null;

    delete json.creator;

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

    return {
      ...json,
      integrity_verified: verified,
    };
  }

  // =====================================
  // CREATE REPORT
  // =====================================
  async create(dto: CreateExpenseReportDto, userId: string) {
    const total_amount = dto.items.reduce((sum, i) => sum + i.amount, 0);

    const expenseNo = await DocumentNumberHelper.generate(
      this.reportModel,
      'expense_no',
      'EXP',
    );

    const paymentModeIds = [
      ...new Set(dto.items.map((i) => i.payment_mode_id)),
    ];

    const paymentModes = await this.paymentModeModel.findAll({
      where: {
        id: paymentModeIds,
        is_active: true,
      },
    });

    if (paymentModes.length !== paymentModeIds.length) {
      throw new BadRequestException('One or more payment modes are invalid.');
    }

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
          expense_no: expenseNo,
          report_date: dto.report_date,
          total_amount,
          created_by: userId, // ✅ IMPORTANT FIX
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
            payment_mode_id: item.payment_mode_id,
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
        expense_no: expenseNo,
        report_date: dto.report_date,
        total_amount,
        item_count: dto.items.length,
        created_by: userId,
      },
    });

    return this.findOne(result.id);
  }

  // =====================================
  // POST REPORT
  // =====================================
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

  // =====================================
  // VOID REPORT
  // =====================================
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

  // =====================================
  // EXPENSE TITLES (UNCHANGED)
  // =====================================

  async getExpenseTitles() {
    return this.titleModel.findAll({
      where: { isActive: true },
      order: [['title', 'ASC']],
    });
  }

  async getExpenseTitle(id: string) {
    const title = await this.titleModel.findByPk(id);
    if (!title) throw new NotFoundException('Expense title not found');
    return title;
  }

  async createExpenseTitle(dto: CreateExpenseTitleDto, userId: string) {
    const exists = await this.titleModel.findOne({
      where: { title: dto.title },
    });

    if (exists) {
      throw new BadRequestException('Expense title already exists');
    }

    const title = await this.titleModel.create({
      title: dto.title,
      isActive: dto.isActive ?? true,
    } as any);

    await this.auditService.log({
      userId,
      action: 'CREATE',
      tableName: 'expense_titles',
      recordId: title.id,
      newValue: title.toJSON(),
    });

    return title;
  }

  async updateExpenseTitle(
    id: string,
    dto: CreateExpenseTitleDto,
    userId: string,
  ) {
    const title = await this.getExpenseTitle(id);
    const oldValue = title.toJSON();

    await title.update({
      title: dto.title,
      isActive: dto.isActive,
    });

    await this.auditService.log({
      userId,
      action: 'UPDATE',
      tableName: 'expense_titles',
      recordId: title.id,
      oldValue,
      newValue: title.toJSON(),
    });

    return title;
  }

  async deleteExpenseTitle(id: string, userId: string) {
    const title = await this.getExpenseTitle(id);

    await title.destroy();

    await this.auditService.log({
      userId,
      action: 'DELETE',
      tableName: 'expense_titles',
      recordId: id,
      oldValue: title.toJSON(),
    });

    return {
      message: 'Expense title deleted successfully',
    };
  }
}
