import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaymentMode } from '../models/expense-item.model';
export class CreateExpenseItemDto {
  @IsString()
  expense_title: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(PaymentMode)
  payment_mode: PaymentMode;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateExpenseReportDto {
  @IsDateString()
  report_date: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateExpenseItemDto)
  items: CreateExpenseItemDto[];
}
