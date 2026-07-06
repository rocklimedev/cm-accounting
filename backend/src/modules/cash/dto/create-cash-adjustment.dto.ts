import {
  IsISO8601,
  IsEnum,
  IsNumber,
  IsString,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCashAdjustmentDto {
  @IsISO8601({ strict: true })
  adjustmentDate: string;

  @IsEnum(['add', 'reduce'])
  type: 'add' | 'reduce';

  @IsNumber()
  @Type(() => Number)
  amount: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
