import { IsEnum, IsNumber, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDebtorEntryDto {
  @IsUUID()
  debtorReportId: string;

  @IsEnum(['new_debtor', 'debtor_received'])
  entryType: 'new_debtor' | 'debtor_received';

  @Type(() => Number)
  @IsNumber()
  amount: number;

  @IsEnum(['cash', 'upi', 'bank', 'card'])
  paymentMode: 'cash' | 'upi' | 'bank' | 'card';
}
