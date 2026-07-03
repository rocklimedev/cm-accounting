import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class CreateExpenseItemDto {
  @IsString()
  expense_title: string;

  @IsNumber()
  amount: number;

  @IsUUID()
  payment_mode_id: string;

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
