import {
  Column,
  DataType,
  Model,
  Table,
  PrimaryKey,
  Default,
} from 'sequelize-typescript';

@Table({
  tableName: 'audit_logs',
  timestamps: false,
})
export class AuditLog extends Model<AuditLog> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column(DataType.UUID)
  declare user_id: string;

  @Column(DataType.STRING(255))
  declare action: string;

  @Column(DataType.STRING(255))
  declare table_name: string;

  @Column(DataType.UUID)
  declare record_id: string;

  @Column(DataType.JSON)
  declare old_value: Record<string, any> | null;

  @Column(DataType.JSON)
  declare new_value: Record<string, any> | null;

  @Column(DataType.STRING(100))
  declare ip_address: string;

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare created_at: Date;
}
