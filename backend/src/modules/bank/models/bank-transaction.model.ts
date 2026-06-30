import {
  Column,
  DataType,
  Model,
  Table,
  PrimaryKey,
  Default,
} from 'sequelize-typescript';

export enum FlowType {
  IN = 'IN',
  OUT = 'OUT',
}

@Table({
  tableName: 'bank_transactions',
  timestamps: false,
})
export class BankTransaction extends Model<BankTransaction> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column(DataType.STRING(255))
  declare bank_name: string;

  @Column(DataType.ENUM(...Object.values(FlowType)))
  declare type: FlowType;

  @Column(DataType.DECIMAL(18, 2))
  declare amount: number;

  @Column(DataType.STRING(50))
  declare reference_type: string;

  @Column(DataType.UUID)
  declare reference_id: string;

  @Column(DataType.TEXT)
  declare description: string;

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare created_at: Date;
}
