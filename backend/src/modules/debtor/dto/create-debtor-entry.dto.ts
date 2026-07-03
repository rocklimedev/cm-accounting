import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsUUID } from 'class-validator';

export class CreateDebtorEntryDto {
  @IsUUID()
  debtorReportId: string;

  @IsEnum(['new_debtor', 'debtor_received'])
  entryType: 'new_debtor' | 'debtor_received';

  @Type(() => Number)
  @IsNumber()
  amount: number;

  @IsUUID()
  paymentModeId: string;
}
