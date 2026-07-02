import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { DebtorReport } from './debtor-reports.model';

@Table({
  tableName: 'debtor_entries',
  timestamps: false,
})
export class DebtorEntry extends Model<DebtorEntry> {
  @PrimaryKey
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => DebtorReport)
  @Column(DataType.UUID)
  debtorReportId: string;

  @BelongsTo(() => DebtorReport)
  report: DebtorReport;

  @Column(DataType.ENUM('new_debtor', 'debtor_received'))
  entryType: 'new_debtor' | 'debtor_received';

  @Column(DataType.DECIMAL(18, 2))
  amount: number;

  @Column(DataType.ENUM('cash', 'upi', 'bank', 'card'))
  paymentMode: 'cash' | 'upi' | 'bank' | 'card';
}
