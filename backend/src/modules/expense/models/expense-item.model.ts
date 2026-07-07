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
import { PaymentMode } from '@/modules/bank/models/payment-mode.model';

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

  @ForeignKey(() => PaymentMode)
  @Column(DataType.UUID)
  declare payment_mode_id: string;

  @BelongsTo(() => PaymentMode)
  declare paymentMode: PaymentMode;

  // Encrypted free-text remarks (AES-256-GCM), same scheme as sales_reports.remarks_*
  @Column(DataType.TEXT)
  declare remarks_cipher: string;

  @Column(DataType.STRING(255))
  declare remarks_iv: string;

  @Column(DataType.STRING(255))
  declare remarks_tag: string;

  @Column(DataType.STRING(50))
  declare remarks_key_version: string;
}
