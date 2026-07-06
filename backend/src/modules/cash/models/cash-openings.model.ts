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
