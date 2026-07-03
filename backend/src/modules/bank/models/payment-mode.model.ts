import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
} from 'sequelize-typescript';

@Table({
  tableName: 'payment_modes',
  timestamps: false,
})
export class PaymentMode extends Model<PaymentMode> {
  @PrimaryKey
  @Column(DataType.UUID)
  declare id: string;

  @Column(DataType.STRING(100))
  declare name: string;

  @Column(DataType.STRING(50))
  declare code: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  declare is_active: boolean;
}
