import {
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCashOpeningDto {
  @IsISO8601({ strict: true }) // More strict and reliable than @IsDateString()
  openingDate: string;

  @IsNumber()
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  previousAmount?: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
