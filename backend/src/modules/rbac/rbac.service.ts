import { Injectable, NotFoundException } from '@nestjs/common';
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
      where: { role_id: roleId },
    });
  }

  async createRole(dto: any) {
    return this.roleModel.create(dto);
  }

  async updateRole(id: string, dto: any) {
    const role = await this.roleModel.findByPk(id);

    if (!role) throw new NotFoundException('Role not found');

    await role.update(dto);

    return role;
  }

  async deleteRole(id: string) {
    const role = await this.roleModel.findByPk(id);

    if (!role) throw new NotFoundException('Role not found');

    await this.rolePermissionModel.destroy({
      where: {
        role_id: id,
      },
    });

    await role.destroy();

    return {
      success: true,
    };
  }

  async hasPermission(
    roleId: string,
    module: string,
    action: 'create' | 'read' | 'update' | 'delete',
  ) {
    const permission = await this.rolePermissionModel.findOne({
      where: {
        role_id: roleId,
        module,
      },
    });

    if (!permission) return false;

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
