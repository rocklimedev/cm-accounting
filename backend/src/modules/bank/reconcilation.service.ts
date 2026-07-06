import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PaymentMode } from '../bank/models/payment-mode.model';
import {
  PaymentModeReportFilterDto,
  PaymentModeReportItem,
} from './dto/payment-mode-report.dto';
import { PaymentLedgerService } from '../payment-ledger/payment-ledger.service';

@Injectable()
export class ReconciliationService {
  constructor(
    @InjectModel(PaymentMode) private paymentModeModel: typeof PaymentMode,
    private readonly paymentLedgerService: PaymentLedgerService,
  ) {}

  async generatePaymentModeReport(
    filters: PaymentModeReportFilterDto,
  ): Promise<PaymentModeReportItem[]> {
    const summaries = await this.paymentLedgerService.getMovementSummary({
      from: filters.from,
      to: filters.to,
      paymentModeId: filters.paymentModeId,
    });

    if (filters.includeInactive || filters.paymentModeId) {
      return summaries;
    }

    const activeModes = await this.paymentModeModel.findAll({
      where: { is_active: true },
      attributes: ['id'],
    });
    const activeIds = new Set(activeModes.map((mode) => mode.id));

    return summaries.filter((summary) => activeIds.has(summary.paymentModeId));
  }
}
