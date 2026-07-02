import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCashOpeningDto {
  @IsDateString()
  openingDate: string;

  @Type(() => Number)
  @IsNumber()
  amount: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  previousAmount?: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
