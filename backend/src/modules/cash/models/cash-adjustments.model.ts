import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  CreatedAt,
} from 'sequelize-typescript';
import { User } from '@/modules/users/models/user.model';

@Table({
  tableName: 'cash_adjustments',
  timestamps: false,
})
export class CashAdjustment extends Model<CashAdjustment> {
  @PrimaryKey
  @Column(DataType.UUID)
  declare id: string;

  @Column({
    field: 'adjustment_date',
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare adjustmentDate: string;

  @Column({
    field: 'type',
    type: DataType.ENUM('add', 'reduce'),
  })
  declare type: 'add' | 'reduce';

  @Column({
    field: 'amount',
    type: DataType.DECIMAL(18, 2),
  })
  declare amount: number;

  @Column({
    field: 'reason',
    type: DataType.TEXT,
    allowNull: false,
  })
  declare reason: string;

  @ForeignKey(() => User)
  @Column({
    field: 'added_by',
    type: DataType.UUID,
  })
  declare addedBy: string;

  @BelongsTo(() => User)
  declare user: User;

  @CreatedAt
  @Column({
    field: 'created_at',
    type: DataType.DATE,
  })
  declare createdAt: Date;
}
