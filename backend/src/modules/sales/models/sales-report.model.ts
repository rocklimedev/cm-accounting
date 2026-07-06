import {
  Column,
  DataType,
  Default,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  Unique,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import { SalesReportItem } from './sales-report-item.model';
import { User } from '../../users/models/user.model'; // adjust path if needed

export enum ReportStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  VOID = 'VOID',
}

@Table({
  tableName: 'sales_reports',
  timestamps: false,
})
export class SalesReport extends Model<SalesReport> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  // Sales Number (e.g. SAL-202607-0001)
  @Unique
  @Column({
    type: DataType.STRING(30),
    allowNull: false,
  })
  declare sales_no: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare report_date: string;

  @Default(0)
  @Column(DataType.DECIMAL(18, 2))
  declare gross_amount: number;

  // ✅ CREATED BY (NEW)
  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare created_by: string;

  @BelongsTo(() => User, {
    foreignKey: 'created_by',
    as: 'creator',
  })
  declare creator: User;

  // Encrypted remarks
  @Column(DataType.TEXT)
  declare remarks_cipher: string;

  @Column(DataType.STRING(255))
  declare remarks_iv: string;

  @Column(DataType.STRING(255))
  declare remarks_tag: string;

  // Integrity verification
  @Column(DataType.STRING(255))
  declare hmac_signature: string;

  @Column(DataType.STRING(255))
  declare previous_hash: string;

  @Default(ReportStatus.DRAFT)
  @Column(DataType.ENUM(...Object.values(ReportStatus)))
  declare status: ReportStatus;

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare created_at: Date;

  @HasMany(() => SalesReportItem, {
    foreignKey: 'sales_report_id',
    as: 'items',
  })
  declare items: SalesReportItem[];
}
