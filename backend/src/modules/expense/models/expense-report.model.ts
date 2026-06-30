import {
  Column,
  DataType,
  Model,
  Table,
  PrimaryKey,
  Default,
  HasMany,
} from 'sequelize-typescript';
import { ExpenseItem } from './expense-item.model';

export enum ReportStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  VOID = 'VOID',
}

@Table({
  tableName: 'expense_reports',
  timestamps: false,
})
export class ExpenseReport extends Model<ExpenseReport> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column(DataType.DATEONLY)
  declare report_date: string;

  @Default(0)
  @Column(DataType.DECIMAL(18, 2))
  declare total_amount: number;

  // HMAC-SHA256 over canonical record + hash chain link, same scheme as sales_reports.
  @Column(DataType.STRING(255))
  declare hmac_signature: string;

  @Column(DataType.STRING(255))
  declare previous_hash: string;

  @Default(ReportStatus.DRAFT)
  @Column(DataType.ENUM(...Object.values(ReportStatus)))
  declare status: ReportStatus;

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare created_at: Date;

  @HasMany(() => ExpenseItem)
  declare items: ExpenseItem[];
}
