import { IsOptional, IsDateString } from 'class-validator';

export class PaymentModeReportFilterDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  paymentModeId?: string;

  @IsOptional()
  includeInactive?: boolean;
}

export interface PaymentModeReportItem {
  paymentModeId: string;
  paymentModeName: string;
  paymentModeCode: string;
  totalExpenses: number;
  totalDebtorReceived: number;
  totalNewDebtors: number;
  netAmount: number; // totalDebtorReceived - totalExpenses
  transactionCount: number;
}
