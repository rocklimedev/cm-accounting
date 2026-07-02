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
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare adjustmentDate: string;

  @Column(DataType.ENUM('add', 'reduce'))
  declare type: 'add' | 'reduce';

  @Column(DataType.DECIMAL(18, 2))
  declare amount: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare reason: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare addedBy: string;

  @BelongsTo(() => User)
  declare user: User;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    field: 'created_at',
  })
  declare createdAt: Date;
}
