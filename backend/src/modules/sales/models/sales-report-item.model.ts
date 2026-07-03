import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { SalesReport } from './sales-report.model';
import { PaymentMode } from '@/modules/bank/models/payment-mode.model';

@Table({
  tableName: 'sales_report_items',
  timestamps: false,
})
export class SalesReportItem extends Model<SalesReportItem> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => SalesReport)
  @Column(DataType.UUID)
  declare sales_report_id: string;

  @BelongsTo(() => SalesReport)
  declare salesReport: SalesReport;

  @ForeignKey(() => PaymentMode)
  @Column(DataType.UUID)
  declare payment_mode_id: string;

  @BelongsTo(() => PaymentMode)
  declare paymentMode: PaymentMode;

  @Default(0)
  @Column(DataType.DECIMAL(18, 2))
  declare amount: number;
}
