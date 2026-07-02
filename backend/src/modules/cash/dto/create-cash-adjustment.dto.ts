import { IsDateString, IsEnum, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCashAdjustmentDto {
  @IsDateString()
  adjustmentDate: string;

  @IsEnum(['add', 'reduce'])
  type: 'add' | 'reduce';

  @Type(() => Number)
  @IsNumber()
  amount: number;

  @IsString()
  reason: string;
}
