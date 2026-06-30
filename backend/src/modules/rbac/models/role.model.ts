import {
  Table,
  Column,
  Model,
  PrimaryKey,
  Default,
  DataType,
  HasMany,
} from 'sequelize-typescript';
import { User } from '@/modules/users/models/user.model';
import { RolePermission } from './role-permission.model';

@Table({
  tableName: 'roles',
  timestamps: false,
})
export class Role extends Model<Role> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column(DataType.STRING(100))
  declare name: string;

  @Column(DataType.STRING(255))
  declare description: string;

  @Default(true)
  @Column(DataType.BOOLEAN)
  declare is_active: boolean;

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare created_at: Date;

  @HasMany(() => User)
  declare users: User[];

  @HasMany(() => RolePermission)
  declare permissions: RolePermission[];
}
