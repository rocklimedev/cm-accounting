import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { SalesReport, ReportStatus } from './models/sales-report.model';
import { SalesReportItem } from './models/sales-report-item.model';
import { PaymentMode } from '@/modules/bank/models/payment-mode.model';

import { CreateSalesReportDto } from './dto/create-sales-report.dto';

import { CryptoService } from '../crypto/crypto.service';
import { AuditService } from '../audit/audit.service';
import { DocumentNumberHelper } from '@/common/helper/document-number.helper';
import { User } from '../users/models/user.model';

@Injectable()
export class SalesService {
  constructor(
    @InjectModel(SalesReport) private reportModel: typeof SalesReport,
    @InjectModel(SalesReportItem) private itemModel: typeof SalesReportItem,
    private crypto: CryptoService,
    private auditService: AuditService,
  ) {}

  // =====================================
  // FIND ALL
  // =====================================
  async findAll() {
    const reports = await this.reportModel.findAll({
      include: [
        {
          model: SalesReportItem,
          as: 'items',
          include: [{ model: PaymentMode, as: 'paymentMode' }],
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
  // FIND ONE
  // =====================================
  async findOne(id: string) {
    const report = await this.reportModel.findByPk(id, {
      include: [
        {
          model: SalesReportItem,
          as: 'items',
          include: [{ model: PaymentMode, as: 'paymentMode' }],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!report) throw new NotFoundException('Sales report not found');

    return this.toSafeJson(report);
  }

  // =====================================
  // SAFE TRANSFORM
  // =====================================
  private toSafeJson(report: SalesReport) {
    const json: any = report.toJSON();

    const remarks = json.remarks_cipher
      ? this.crypto.decrypt({
          cipher: json.remarks_cipher,
          iv: json.remarks_iv,
          tag: json.remarks_tag,
        })
      : null;

    const { hmac_signature, remarks_cipher, remarks_iv, remarks_tag, ...rest } =
      json;

    const verified = hmac_signature
      ? this.crypto.verify(this.signableFields(json), hmac_signature)
      : null;

    const totals = (json.items || []).reduce((acc: any, item: any) => {
      const mode = item.paymentMode?.name || item.payment_mode_id;
      acc[mode] = (acc[mode] || 0) + Number(item.amount);
      return acc;
    }, {});

    return {
      ...rest,
      remarks,
      integrity_verified: verified,

      // 👇 creator info
      created_by_user: json.creator
        ? {
            id: json.creator.id,
            name: json.creator.name,
            email: json.creator.email,
          }
        : null,

      items: json.items,
      totals,
    };
  }

  // =====================================
  // SIGNABLE DATA
  // =====================================
  private signableFields(json: any) {
    return {
      report_date: json.report_date,
      gross_amount: json.gross_amount,
      previous_hash: json.previous_hash,
      items: (json.items || []).map((i: any) => ({
        payment_mode_id: i.payment_mode_id,
        amount: i.amount,
      })),
    };
  }

  // =====================================
  // CREATE
  // =====================================
  async create(dto: CreateSalesReportDto, userId: string) {
    const { report_date, gross_amount, remarks, items } = dto;

    if (!items?.length) {
      throw new BadRequestException('At least one payment item is required');
    }

    const sumOfParts = items.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );

    if (Math.abs(sumOfParts - gross_amount) > 0.01) {
      throw new BadRequestException(
        'Sum of item amounts must equal gross_amount',
      );
    }

    const salesNo = await DocumentNumberHelper.generate(
      this.reportModel,
      'sales_no',
      'SAL',
    );

    const encrypted = remarks
      ? this.crypto.encrypt(remarks)
      : { cipher: null, iv: null, tag: null };

    const lastPosted = await this.reportModel.findOne({
      where: { status: ReportStatus.POSTED },
      order: [['created_at', 'DESC']],
    });

    const previous_hash = this.crypto.chainHash(
      lastPosted?.previous_hash ?? null,
      {
        id: lastPosted?.id ?? null,
        report_date: lastPosted?.report_date ?? null,
        gross_amount: lastPosted?.gross_amount ?? null,
      },
    );

    const report = await this.reportModel.create({
      sales_no: salesNo,
      report_date,
      gross_amount,
      created_by: userId, // ✅ IMPORTANT
      remarks_cipher: encrypted.cipher,
      remarks_iv: encrypted.iv,
      remarks_tag: encrypted.tag,
      previous_hash,
      status: ReportStatus.DRAFT,
    } as any);

    const itemRecords = items.map((item) => ({
      sales_report_id: report.id,
      payment_mode_id: item.payment_mode_id,
      amount: item.amount,
    }));

    await this.itemModel.bulkCreate(itemRecords as any);

    const fullReport = await this.reportModel.findByPk(report.id, {
      include: [
        { model: SalesReportItem, as: 'items' },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!fullReport) {
      throw new NotFoundException('Sales report not found after creation');
    }

    const signatureData = this.signableFields(fullReport.toJSON());
    const hmac_signature = this.crypto.sign(signatureData);

    await fullReport.update({ hmac_signature });

    await this.auditService.log({
      userId,
      action: 'CREATE',
      tableName: 'sales_reports',
      recordId: report.id,
      newValue: {
        sales_no: salesNo,
        report_date,
        gross_amount,
        created_by: userId,
      },
    });

    return this.toSafeJson(fullReport);
  }

  // =====================================
  // POST
  // =====================================
  async post(id: string, userId: string) {
    const report = await this.reportModel.findByPk(id);
    if (!report) throw new NotFoundException('Sales report not found');
    if (report.status !== ReportStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT reports can be posted');
    }

    const before = report.status;
    report.status = ReportStatus.POSTED;
    await report.save();

    await this.auditService.log({
      userId,
      action: 'POST',
      tableName: 'sales_reports',
      recordId: report.id,
      oldValue: { status: before },
      newValue: { status: report.status },
    });

    return this.findOne(id);
  }

  // =====================================
  // VOID
  // =====================================
  async voidReport(id: string, userId: string) {
    const report = await this.reportModel.findByPk(id);
    if (!report) throw new NotFoundException('Sales report not found');

    const before = report.status;
    report.status = ReportStatus.VOID;
    await report.save();

    await this.auditService.log({
      userId,
      action: 'VOID',
      tableName: 'sales_reports',
      recordId: report.id,
      oldValue: { status: before },
      newValue: { status: report.status },
    });

    return this.findOne(id);
  }
}
