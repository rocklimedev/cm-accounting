import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { FlowType } from '../models/bank-transaction.model';
export class CreateBankTransactionDto {
  @IsString()
  bank_name: string;

  @IsEnum(FlowType)
  type: FlowType;

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
