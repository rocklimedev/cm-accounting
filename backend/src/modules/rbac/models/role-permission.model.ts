import {
  Table,
  Column,
  Model,
  PrimaryKey,
  Default,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Role } from './role.model';

@Table({
  tableName: 'role_permissions',
  timestamps: false,
})
export class RolePermission extends Model<RolePermission> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => Role)
  @Column(DataType.UUID)
  declare role_id: string;

  @BelongsTo(() => Role)
  declare role: Role;

  @Column(DataType.STRING(100))
  declare module: string;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare can_create: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare can_read: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare can_update: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare can_delete: boolean;
}
