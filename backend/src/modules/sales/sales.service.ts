import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SalesReport, ReportStatus } from './models/sales-report.model';
import { CreateSalesReportDto } from './dto/create-sales-report.dto';
import { CryptoService } from '../crypto/crypto.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SalesService {
  constructor(
    @InjectModel(SalesReport) private model: typeof SalesReport,
    private crypto: CryptoService,
    private auditService: AuditService,
  ) {}

  async findAll() {
    const reports = await this.model.findAll({
      order: [['report_date', 'DESC']],
    });
    return reports.map((r) => this.toSafeJson(r));
  }

  async findOne(id: string) {
    const report = await this.model.findByPk(id);
    if (!report) throw new NotFoundException('Sales report not found');
    return this.toSafeJson(report);
  }

  /** Decrypts remarks and exposes a verified flag instead of raw crypto fields. */
  private toSafeJson(report: SalesReport) {
    const json: any = report.toJSON();
    const remarks = this.crypto.decrypt({
      cipher: json.remarks_cipher,
      iv: json.remarks_iv,
      tag: json.remarks_tag,
    });

    const { hmac_signature, ...rest } = json;
    const verified = hmac_signature
      ? this.crypto.verify(this.signableFields(json), hmac_signature)
      : null;

    delete rest.remarks_cipher;
    delete rest.remarks_iv;
    delete rest.remarks_tag;

    return { ...rest, remarks, integrity_verified: verified };
  }

  private signableFields(json: any) {
    return {
      report_date: json.report_date,
      gross_amount: json.gross_amount,
      cash_amount: json.cash_amount,
      upi_amount: json.upi_amount,
      bank_amount: json.bank_amount,
      card_amount: json.card_amount,
      debtor_amount: json.debtor_amount,
      remarks_cipher: json.remarks_cipher,
      previous_hash: json.previous_hash,
    };
  }

  async create(dto: CreateSalesReportDto, userId: string) {
    const cash_amount = dto.cash_amount ?? 0;
    const upi_amount = dto.upi_amount ?? 0;
    const bank_amount = dto.bank_amount ?? 0;
    const card_amount = dto.card_amount ?? 0;
    const debtor_amount = dto.debtor_amount ?? 0;

    const sumOfParts =
      cash_amount + upi_amount + bank_amount + card_amount + debtor_amount;
    if (Math.abs(sumOfParts - dto.gross_amount) > 0.01) {
      throw new BadRequestException(
        'Sum of cash/upi/bank/card/debtor amounts must equal gross_amount',
      );
    }

    const encrypted = dto.remarks
      ? this.crypto.encrypt(dto.remarks)
      : { cipher: null, iv: null, tag: null };

    // Chain to the most recently POSTED report so the ledger is tamper-evident end to end.
    const lastPosted = await this.model.findOne({
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

    const baseFields = {
      report_date: dto.report_date,
      gross_amount: dto.gross_amount,
      cash_amount,
      upi_amount,
      bank_amount,
      card_amount,
      debtor_amount,
      remarks_cipher: encrypted.cipher,
    };

    const hmac_signature = this.crypto.sign({ ...baseFields, previous_hash });

    const report = await this.model.create({
      ...baseFields,
      remarks_iv: encrypted.iv,
      remarks_tag: encrypted.tag,
      hmac_signature,
      previous_hash,
      status: ReportStatus.DRAFT,
    } as any);

    await this.auditService.log({
      userId,
      action: 'CREATE',
      tableName: 'sales_reports',
      recordId: report.id,
      newValue: { ...baseFields, remarks_cipher: '[ENCRYPTED]' },
    });

    return this.toSafeJson(report);
  }

  /** Posting locks the figures and signature in place — only ADMIN may do this in the controller. */
  async post(id: string, userId: string) {
    const report = await this.model.findByPk(id);
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

    return this.toSafeJson(report);
  }

  async voidReport(id: string, userId: string) {
    const report = await this.model.findByPk(id);
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

    return this.toSafeJson(report);
  }
}
