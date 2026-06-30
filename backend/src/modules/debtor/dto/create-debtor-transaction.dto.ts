import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { DebtorTxType } from '../models/debtor-transaction.model';
export class CreateDebtorTransactionDto {
  @IsString()
  customer_name: string;

  @IsEnum(DebtorTxType)
  type: DebtorTxType;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  reference_type?: string;

  @IsOptional()
  @IsUUID()
  reference_id?: string;
}
