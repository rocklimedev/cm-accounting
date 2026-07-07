import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
  HasMany,
  AllowNull,
  AutoIncrement,
  Unique,
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { DebtorEntry } from './debtor-entries.model';

@Table({
  tableName: 'debtor_reports',
  timestamps: false,
})
export class DebtorReport extends Model<DebtorReport> {
  @PrimaryKey
  @Default(() => uuidv4())
  @Column({
    type: DataType.UUID,
    field: 'id',
  })
  declare id: string;
  @Unique
  @AllowNull(false)
  @Column({
    type: DataType.STRING(20),
    field: 'debtor_no',
  })
  declare debtorNo: string;
  @AllowNull(false)
  @Column({
    type: DataType.DATEONLY,
    field: 'report_date',
  })
  declare reportDate: string;

  @Default('0.00')
  @Column({
    type: DataType.DECIMAL(18, 2),
    field: 'opening_amount',
  })
  declare openingAmount: string;

  @Default('0.00')
  @Column({
    type: DataType.DECIMAL(18, 2),
    field: 'new_debtor_total',
  })
  declare newDebtorTotal: string;

  @Default('0.00')
  @Column({
    type: DataType.DECIMAL(18, 2),
    field: 'received_total',
  })
  declare receivedTotal: string;

  @Default('0.00')
  @Column({
    type: DataType.DECIMAL(18, 2),
    field: 'closing_amount',
  })
  declare closingAmount: string;

  @AllowNull(true)
  @Column({
    type: DataType.TEXT,
    field: 'remarks_cipher',
  })
  declare remarksCipher?: string;

  @AllowNull(true)
  @Column({
    type: DataType.STRING(255),
    field: 'remarks_iv',
  })
  declare remarksIv?: string;

  @AllowNull(true)
  @Column({
    type: DataType.STRING(255),
    field: 'remarks_tag',
  })
  declare remarksTag?: string;

  @AllowNull(true)
  @Column({
    type: DataType.STRING(50),
    field: 'remarks_key_version',
  })
  declare remarksKeyVersion?: string;

  @AllowNull(true)
  @Column({
    type: DataType.STRING(255),
    field: 'hmac_signature',
  })
  declare hmacSignature?: string;

  @AllowNull(true)
  @Column({
    type: DataType.STRING(255),
    field: 'previous_hash',
  })
  declare previousHash?: string;

  @Default('draft')
  @Column({
    type: DataType.ENUM('draft', 'submitted', 'posted', 'void'),
    field: 'status',
  })
  declare status: 'draft' | 'submitted' | 'posted' | 'void';

  @AllowNull(true)
  @Column({
    type: DataType.UUID,
    field: 'submitted_by',
  })
  declare submittedBy?: string;

  @AllowNull(true)
  @Column({
    type: DataType.TEXT,
    field: 'edit_reason',
  })
  declare editReason?: string;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    field: 'created_at',
  })
  declare createdAt: Date;

  @HasMany(() => DebtorEntry)
  declare entries: DebtorEntry[];
}
