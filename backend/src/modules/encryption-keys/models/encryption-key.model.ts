import {
  Column,
  DataType,
  Model,
  Table,
  PrimaryKey,
  Default,
} from 'sequelize-typescript';

/**
 * Bookkeeping for key rotation only. The actual symmetric key never lives in the DB —
 * it's supplied via the ENCRYPTION_KEY env var / a secrets manager (e.g. Vault, AWS KMS,
 * GCP Secret Manager). `encrypted_key` here is reserved for a KMS-wrapped (envelope
 * encrypted) key blob if you adopt envelope encryption later; it is NOT required for the
 * current AES-256-GCM + HMAC scheme used by CryptoService.
 */
@Table({
  tableName: 'encryption_keys',
  timestamps: false,
})
export class EncryptionKey extends Model<EncryptionKey> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column(DataType.STRING(50))
  declare key_version: string;

  @Column(DataType.TEXT)
  declare encrypted_key: string;

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare created_at: Date;
}
