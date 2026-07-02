import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  HasMany,
  CreatedAt,
} from 'sequelize-typescript';
import { DebtorEntry } from './debtor-entries.model';

@Table({
  tableName: 'debtor_reports',
  timestamps: false,
})
export class DebtorReport extends Model<DebtorReport> {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  reportDate: string;

  @Default(0)
  @Column(DataType.DECIMAL(18, 2))
  openingAmount: number;

  @Default(0)
  @Column(DataType.DECIMAL(18, 2))
  newDebtorTotal: number;

  @Default(0)
  @Column(DataType.DECIMAL(18, 2))
  receivedTotal: number;

  @Default(0)
  @Column(DataType.DECIMAL(18, 2))
  closingAmount: number;

  @Column(DataType.TEXT)
  remarksCipher: string;

  @Column(DataType.STRING(255))
  remarksIv: string;

  @Column(DataType.STRING(255))
  remarksTag: string;

  @Column(DataType.STRING(255))
  hmacSignature: string;

  @Column(DataType.STRING(255))
  previousHash: string;

  @Default('draft')
  @Column(DataType.ENUM('draft', 'submitted', 'posted', 'void'))
  status: 'draft' | 'submitted' | 'posted' | 'void';

  @Column(DataType.UUID)
  submittedBy: string;

  @Column(DataType.TEXT)
  editReason: string;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    field: 'created_at',
  })
  declare createdAt: Date;
  @HasMany(() => DebtorEntry)
  entries: DebtorEntry[];
}
