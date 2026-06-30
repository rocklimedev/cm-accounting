import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateSalesReportDto {
  @IsDateString()
  report_date: string;

  @IsNumber()
  @Min(0)
  gross_amount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cash_amount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  upi_amount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bank_amount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  card_amount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  debtor_amount?: number;

  // Plaintext remarks — encrypted server-side before storage, never persisted as-is.
  @IsOptional()
  @IsString()
  remarks?: string;
}
