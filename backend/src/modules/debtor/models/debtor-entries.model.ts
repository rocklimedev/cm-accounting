import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  Default,
  AllowNull,
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { DebtorReport } from './debtor-reports.model';
import { PaymentMode } from '../../bank/models/payment-mode.model';

@Table({
  tableName: 'debtor_entries',
  timestamps: false,
})
export class DebtorEntry extends Model<DebtorEntry> {
  @PrimaryKey
  @Default(() => uuidv4())
  @Column({
    type: DataType.UUID,
    field: 'id',
  })
  declare id: string;

  @AllowNull(true)
  @ForeignKey(() => DebtorReport)
  @Column({
    type: DataType.UUID,
    field: 'debtor_report_id',
  })
  declare debtorReportId: string;

  @BelongsTo(() => DebtorReport)
  declare report: DebtorReport;

  @AllowNull(false)
  @Column({
    type: DataType.ENUM('new_debtor', 'debtor_received'),
    field: 'entry_type',
  })
  declare entryType: 'new_debtor' | 'debtor_received';

  @AllowNull(false)
  @Column({
    type: DataType.DECIMAL(18, 2),
    field: 'amount',
  })
  declare amount: string;
  @AllowNull(true)
  @ForeignKey(() => PaymentMode)
  @Column({
    type: DataType.UUID,
    field: 'payment_mode_id',
  })
  declare paymentModeId?: string;

  @BelongsTo(() => PaymentMode)
  declare paymentMode: PaymentMode;
}
