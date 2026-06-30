import {
  Column,
  DataType,
  Model,
  Table,
  PrimaryKey,
  Default,
  Unique,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Role } from '@/modules/rbac/models/role.model';

@Table({
  tableName: 'users',
  timestamps: false,
})
export class User extends Model<User> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column(DataType.STRING(255))
  declare name: string;

  @Unique
  @Column(DataType.STRING(255))
  declare email: string;

  @Column(DataType.STRING(255))
  declare password_hash: string;

  @ForeignKey(() => Role)
  @Column(DataType.UUID)
  declare role_id: string;

  @BelongsTo(() => Role)
  declare role: Role;

  @Default(true)
  @Column(DataType.BOOLEAN)
  declare is_active: boolean;

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare created_at: Date;
}
