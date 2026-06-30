import {
  Column,
  DataType,
  Model,
  Table,
  PrimaryKey,
  Default,
} from 'sequelize-typescript';

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

  @Column(DataType.DATEONLY)
  declare report_date: string;

  @Default(0)
  @Column(DataType.DECIMAL(18, 2))
  declare gross_amount: number;

  @Default(0)
  @Column(DataType.DECIMAL(18, 2))
  declare cash_amount: number;

  @Default(0)
  @Column(DataType.DECIMAL(18, 2))
  declare upi_amount: number;

  @Default(0)
  @Column(DataType.DECIMAL(18, 2))
  declare bank_amount: number;

  @Default(0)
  @Column(DataType.DECIMAL(18, 2))
  declare card_amount: number;

  @Default(0)
  @Column(DataType.DECIMAL(18, 2))
  declare debtor_amount: number;

  // Encrypted free-text remarks (AES-256-GCM) — never store plaintext remarks.
  @Column(DataType.TEXT)
  declare remarks_cipher: string;

  @Column(DataType.STRING(255))
  declare remarks_iv: string;

  @Column(DataType.STRING(255))
  declare remarks_tag: string;

  // HMAC-SHA256 over the canonical record — detects tampering with posted figures.
  @Column(DataType.STRING(255))
  declare hmac_signature: string;

  // SHA-256 hash chain link to the previous POSTED sales report — tamper-evident ledger.
  @Column(DataType.STRING(255))
  declare previous_hash: string;

  @Default(ReportStatus.DRAFT)
  @Column(DataType.ENUM(...Object.values(ReportStatus)))
  declare status: ReportStatus;

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare created_at: Date;
}
