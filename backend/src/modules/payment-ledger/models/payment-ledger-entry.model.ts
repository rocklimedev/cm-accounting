import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { PaymentMode } from '@/modules/bank/models/payment-mode.model';
import { User } from '@/modules/users/models/user.model';

export enum PaymentLedgerFlowType {
  OPENING = 'OPENING',
  IN = 'IN',
  OUT = 'OUT',
}

@Table({
  tableName: 'payment_ledger_entries',
  timestamps: false,
})
export class PaymentLedgerEntry extends Model<PaymentLedgerEntry> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column({
    field: 'entry_date',
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare entryDate: string;

  @ForeignKey(() => PaymentMode)
  @Column({
    field: 'payment_mode_id',
    type: DataType.UUID,
    allowNull: false,
  })
  declare paymentModeId: string;

  @BelongsTo(() => PaymentMode)
  declare paymentMode: PaymentMode;

  @Column({
    field: 'flow_type',
    type: DataType.ENUM(...Object.values(PaymentLedgerFlowType)),
    allowNull: false,
  })
  declare flowType: PaymentLedgerFlowType;

  @Column({
    type: DataType.DECIMAL(18, 2),
    allowNull: false,
  })
  declare amount: number;

  @Column({
    field: 'source_type',
    type: DataType.STRING(50),
    allowNull: false,
  })
  declare sourceType: string;

  @Column({
    field: 'source_id',
    type: DataType.UUID,
    allowNull: false,
  })
  declare sourceId: string;

  @Column(DataType.TEXT)
  declare description?: string;

  @ForeignKey(() => User)
  @Column({
    field: 'created_by',
    type: DataType.UUID,
  })
  declare createdBy?: string;

  @BelongsTo(() => User)
  declare creator: User;

  @Default(DataType.NOW)
  @Column({
    field: 'created_at',
    type: DataType.DATE,
  })
  declare createdAt: Date;
}
