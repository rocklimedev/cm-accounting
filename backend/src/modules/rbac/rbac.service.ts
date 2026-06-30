import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Role } from './models/role.model';
import { RolePermission } from './models/role-permission.model';

@Injectable()
export class RbacService {
  constructor(
    @InjectModel(Role)
    private readonly roleModel: typeof Role,

    @InjectModel(RolePermission)
    private readonly rolePermissionModel: typeof RolePermission,
  ) {}

  async getRoles() {
    return this.roleModel.findAll({
      include: [RolePermission],
    });
  }

  async getRoleById(id: string) {
    return this.roleModel.findByPk(id, {
      include: [RolePermission],
    });
  }

  async getPermissions(roleId: string) {
    return this.rolePermissionModel.findAll({
      where: {
        role_id: roleId,
      },
    });
  }

  async hasPermission(
    roleId: string,
    module: string,
    action: 'create' | 'read' | 'update' | 'delete',
  ): Promise<boolean> {
    const permission = await this.rolePermissionModel.findOne({
      where: {
        role_id: roleId,
        module,
      },
    });

    if (!permission) {
      return false;
    }

    switch (action) {
      case 'create':
        return permission.can_create;
      case 'read':
        return permission.can_read;
      case 'update':
        return permission.can_update;
      case 'delete':
        return permission.can_delete;
      default:
        return false;
    }
  }
}
