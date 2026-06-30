import { Controller, Get, Param } from '@nestjs/common';

import { RbacService } from './rbac.service';

@Controller('rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('roles')
  getRoles() {
    return this.rbacService.getRoles();
  }

  @Get('roles/:id')
  getRole(@Param('id') id: string) {
    return this.rbacService.getRoleById(id);
  }

  @Get('roles/:id/permissions')
  getPermissions(@Param('id') id: string) {
    return this.rbacService.getPermissions(id);
  }
}
