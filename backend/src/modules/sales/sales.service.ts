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
import { CreateSalesReportDto } from './dto/create-sales-report.dto';
import { CryptoService } from '../crypto/crypto.service';
import { AuditService } from '../audit/audit.service';
import { PaymentMode } from '@/modules/bank/models/payment-mode.model';
import { DocumentNumberHelper } from '@/common/helper/document-number.helper';
@Injectable()
export class SalesService {
  constructor(
    @InjectModel(SalesReport) private reportModel: typeof SalesReport,
    @InjectModel(SalesReportItem) private itemModel: typeof SalesReportItem,
    private crypto: CryptoService,
    private auditService: AuditService,
  ) {}

  async findAll() {
    const reports = await this.reportModel.findAll({
      include: [
        {
          model: SalesReportItem,
          as: 'items',
          include: [{ model: PaymentMode, as: 'paymentMode' }],
        },
      ],
      order: [['report_date', 'DESC']],
    });

    return reports.map((r) => this.toSafeJson(r));
  }

  async findOne(id: string) {
    const report = await this.reportModel.findByPk(id, {
      include: [
        {
          model: SalesReportItem,
          as: 'items',
          include: [{ model: PaymentMode, as: 'paymentMode' }],
        },
      ],
    });

    if (!report) throw new NotFoundException('Sales report not found');
    return this.toSafeJson(report);
  }

  /** Decrypts remarks and adds verified flag + computed totals */
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

    // Compute totals from items for convenience
    const totals = (json.items || []).reduce((acc: any, item: any) => {
      const mode = item.paymentMode?.name || item.payment_mode_id;
      acc[mode] = (acc[mode] || 0) + Number(item.amount);
      return acc;
    }, {});

    return {
      ...rest,
      remarks,
      integrity_verified: verified,
      items: json.items,
      totals, // e.g. { "Cash": 12500, "UPI": 8300, ... }
    };
  }

  private signableFields(json: any) {
    return {
      report_date: json.report_date,
      gross_amount: json.gross_amount,
      previous_hash: json.previous_hash,
      // Items are part of integrity (we'll hash them too)
      items: (json.items || []).map((i: any) => ({
        payment_mode_id: i.payment_mode_id,
        amount: i.amount,
      })),
    };
  }

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

    // Generate Sales Number
    const salesNo = await DocumentNumberHelper.generate(
      this.reportModel,
      'sales_no',
      'SAL',
    );

    // Encrypt remarks
    const encrypted = remarks
      ? this.crypto.encrypt(remarks)
      : { cipher: null, iv: null, tag: null };

    // Get last posted report for chaining
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
      remarks_cipher: encrypted.cipher,
      remarks_iv: encrypted.iv,
      remarks_tag: encrypted.tag,
      previous_hash,
      status: ReportStatus.DRAFT,
    } as any);

    // Create items
    const itemRecords = items.map((item) => ({
      sales_report_id: report.id,
      payment_mode_id: item.payment_mode_id,
      amount: item.amount,
    }));

    await this.itemModel.bulkCreate(itemRecords as any);

    // Reload with items for signing
    const fullReport = await this.reportModel.findByPk(report.id, {
      include: [{ model: SalesReportItem, as: 'items' }],
    });

    if (!fullReport) {
      throw new NotFoundException('Sales report not found after creation');
    }

    // Sign after items are created
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
        remarks_cipher: '[ENCRYPTED]',
      },
    });

    return this.toSafeJson(fullReport);
  }
  async post(id: string, userId: string) {
    const report = await this.reportModel.findByPk(id);
    if (!report) throw new NotFoundException('Sales report not found');
    if (report.status !== ReportStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT reports can be posted');
    }

    const before = report.toJSON();
    report.status = ReportStatus.POSTED;
    await report.save();

    await this.auditService.log({
      userId,
      action: 'POST',
      tableName: 'sales_reports',
      recordId: report.id,
      oldValue: { status: before.status },
      newValue: { status: report.status },
    });

    const updated = await this.reportModel.findByPk(id, {
      include: ['items'],
    });
    if (!updated) {
      throw new NotFoundException('Sales report not found after update');
    }
    return this.toSafeJson(updated);
  }

  async voidReport(id: string, userId: string) {
    const report = await this.reportModel.findByPk(id);
    if (!report) throw new NotFoundException('Sales report not found');

    const before = report.toJSON();
    report.status = ReportStatus.VOID;
    await report.save();

    await this.auditService.log({
      userId,
      action: 'VOID',
      tableName: 'sales_reports',
      recordId: report.id,
      oldValue: { status: before.status },
      newValue: { status: report.status },
    });

    const updated = await this.reportModel.findByPk(id, {
      include: ['items'],
    });
    if (!updated) {
      throw new NotFoundException('Sales report not found after update');
    }
    return this.toSafeJson(updated);
  }
}
