import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { EntryType } from '../models/ledger-entry.model';
export class CreateLedgerEntryDto {
  @IsDateString()
  entry_date: string;

  @IsString()
  account_name: string;

  @IsEnum(EntryType)
  entry_type: EntryType;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  reference_type?: string;

  @IsOptional()
  @IsUUID()
  reference_id?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
