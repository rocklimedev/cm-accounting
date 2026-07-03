import {
  Column,
  DataType,
  Model,
  Table,
  PrimaryKey,
  Default,
  HasMany,
  Unique,
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

  // Expense Number (e.g. EXP-202607-0001)
  @Unique
  @Column({
    type: DataType.STRING(30),
    allowNull: false,
  })
  declare expense_no: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare report_date: string;

  @Default(0)
  @Column(DataType.DECIMAL(18, 2))
  declare total_amount: number;

  // HMAC-SHA256 over canonical record + hash chain link
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

  @HasMany(() => ExpenseItem, {
    foreignKey: 'expense_report_id',
    as: 'items',
  })
  declare items: ExpenseItem[];
}
