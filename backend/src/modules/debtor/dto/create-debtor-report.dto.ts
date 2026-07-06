import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDebtorReportDto {
  @IsDateString()
  reportDate: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  openingAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  newDebtorTotal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  receivedTotal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  closingAmount?: number;

  // =========================
  // CREATED BY (IMPORTANT ADD)
  // =========================
  @IsOptional()
  @IsUUID()
  submittedBy?: string;

  @IsOptional()
  @IsString()
  remarksCipher?: string;

  @IsOptional()
  @IsString()
  remarksIv?: string;

  @IsOptional()
  @IsString()
  remarksTag?: string;

  @IsOptional()
  @IsString()
  hmacSignature?: string;

  @IsOptional()
  @IsString()
  previousHash?: string;

  @IsOptional()
  @IsEnum(['draft', 'submitted', 'posted', 'void'])
  status?: 'draft' | 'submitted' | 'posted' | 'void';

  @IsOptional()
  @IsString()
  editReason?: string;
}
