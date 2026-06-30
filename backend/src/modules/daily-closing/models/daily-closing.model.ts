import {
  Column,
  DataType,
  Model,
  Table,
  PrimaryKey,
  Default,
  Unique,
} from 'sequelize-typescript';

@Table({
  tableName: 'daily_closing',
  timestamps: false,
})
export class DailyClosing extends Model<DailyClosing> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Unique
  @Column(DataType.DATEONLY)
  declare report_date: string;

  @Default(0)
  @Column(DataType.DECIMAL(18, 2))
  declare sales_total: number;

  @Default(0)
  @Column(DataType.DECIMAL(18, 2))
  declare expense_total: number;

  @Default(0)
  @Column(DataType.DECIMAL(18, 2))
  declare cash_total: number;

  @Default(0)
  @Column(DataType.DECIMAL(18, 2))
  declare debtor_total: number;

  // SHA-256 hash chained to the previous day's closing — tamper-evident daily snapshot.
  @Column(DataType.STRING(255))
  declare hash: string;

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare created_at: Date;
}
