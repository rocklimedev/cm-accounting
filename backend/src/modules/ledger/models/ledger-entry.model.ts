import {
  Column,
  DataType,
  Model,
  Table,
  PrimaryKey,
  Default,
} from 'sequelize-typescript';

export enum EntryType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

@Table({
  tableName: 'ledger_entries',
  timestamps: false,
})
export class LedgerEntry extends Model<LedgerEntry> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column(DataType.DATEONLY)
  declare entry_date: string;

  @Column(DataType.STRING(255))
  declare account_name: string;

  @Column(DataType.ENUM(...Object.values(EntryType)))
  declare entry_type: EntryType;

  @Column(DataType.DECIMAL(18, 2))
  declare amount: number;

  @Column(DataType.STRING(50))
  declare reference_type: string;

  @Column(DataType.UUID)
  declare reference_id: string;

  @Column(DataType.TEXT)
  declare description: string;

  @Column(DataType.UUID)
  declare created_by: string;

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare created_at: Date;
}
