import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class CreateDebtorEntryDto {
  @IsUUID()
  debtorReportId: string;

  @IsEnum(['new_debtor', 'debtor_received'])
  entryType: 'new_debtor' | 'debtor_received';

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsUUID()
  @IsOptional()
  @ValidateIf(
    (dto: CreateDebtorEntryDto) => dto.entryType === 'debtor_received',
  )
  paymentModeId?: string | null;
}
