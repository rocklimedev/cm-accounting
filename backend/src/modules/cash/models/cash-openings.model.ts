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
  tableName: 'cash_openings',
  timestamps: false,
})
export class CashOpening extends Model<CashOpening> {
  @PrimaryKey
  @Column(DataType.UUID)
  declare id: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare openingDate: string;

  @Column(DataType.DECIMAL(18, 2))
  declare amount: number;

  @Column(DataType.DECIMAL(18, 2))
  declare previousAmount: number;

  @Column(DataType.TEXT)
  declare reason: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare enteredBy: string;

  @BelongsTo(() => User)
  declare user: User;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    field: 'created_at',
  })
  declare createdAt: Date;
}
