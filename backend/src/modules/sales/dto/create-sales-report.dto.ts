import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class SalesReportItemDto {
  @IsUUID()
  @IsNotEmpty()
  payment_mode_id: string;

  @IsNumber()
  @Min(0)
  amount: number;
}

export class CreateSalesReportDto {
  @IsDateString()
  report_date: string;

  @IsNumber()
  @Min(0)
  gross_amount: number;

  @IsArray()
  @IsNotEmpty({ message: 'At least one payment item is required' })
  @ValidateNested({ each: true })
  @Type(() => SalesReportItemDto)
  items: SalesReportItemDto[];

  // Plaintext remarks — will be encrypted server-side
  @IsOptional()
  @IsString()
  remarks?: string;
}
