import {
  Column,
  DataType,
  Model,
  Table,
  PrimaryKey,
  Default,
} from 'sequelize-typescript';

export enum DebtorTxType {
  NEW = 'NEW',
  PAYMENT = 'PAYMENT',
  ADJUSTMENT = 'ADJUSTMENT',
}

@Table({
  tableName: 'debtor_transactions',
  timestamps: false,
})
export class DebtorTransaction extends Model<DebtorTransaction> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column(DataType.STRING(255))
  declare customer_name: string;

  @Column(DataType.ENUM(...Object.values(DebtorTxType)))
  declare type: DebtorTxType;

  @Column(DataType.DECIMAL(18, 2))
  declare amount: number;

  @Column(DataType.STRING(50))
  declare reference_type: string;

  @Column(DataType.UUID)
  declare reference_id: string;

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare created_at: Date;
}
