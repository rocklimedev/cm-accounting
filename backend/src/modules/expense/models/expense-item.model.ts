import {
  Column,
  DataType,
  Model,
  Table,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { ExpenseReport } from './expense-report.model';

export enum PaymentMode {
  CASH = 'CASH',
  UPI = 'UPI',
  BANK = 'BANK',
  CARD = 'CARD',
}

@Table({
  tableName: 'expense_items',
  timestamps: false,
})
export class ExpenseItem extends Model<ExpenseItem> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => ExpenseReport)
  @Column(DataType.UUID)
  declare expense_report_id: string;

  @BelongsTo(() => ExpenseReport)
  declare report: ExpenseReport;

  @Column(DataType.STRING(255))
  declare expense_title: string;

  @Column(DataType.DECIMAL(18, 2))
  declare amount: number;

  @Column(DataType.ENUM(...Object.values(PaymentMode)))
  declare payment_mode: PaymentMode;

  // Encrypted free-text remarks (AES-256-GCM), same scheme as sales_reports.remarks_*
  @Column(DataType.TEXT)
  declare remarks_cipher: string;

  @Column(DataType.STRING(255))
  declare remarks_iv: string;

  @Column(DataType.STRING(255))
  declare remarks_tag: string;
}
