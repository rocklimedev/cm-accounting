import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  CreatedAt,
} from 'sequelize-typescript';
import { User } from '@/modules/users/models/user.model';
import { PaymentMode } from '@/modules/bank/models/payment-mode.model';
@Table({
  tableName: 'cash_openings',
  timestamps: false,
})
export class CashOpening extends Model<CashOpening> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column({
    field: 'opening_date',
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare openingDate: string;

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
    field: 'amount',
    type: DataType.DECIMAL(18, 2),
  })
  declare amount: number;

  @Column({
    field: 'previous_amount',
    type: DataType.DECIMAL(18, 2),
  })
  declare previousAmount: number;

  @Column({
    field: 'reason',
    type: DataType.TEXT,
  })
  declare reason: string;

  @ForeignKey(() => User)
  @Column({
    field: 'entered_by',
    type: DataType.UUID,
  })
  declare enteredBy: string;

  @BelongsTo(() => User)
  declare user: User;

  @CreatedAt
  @Column({
    field: 'created_at',
    type: DataType.DATE,
  })
  declare createdAt: Date;
}
