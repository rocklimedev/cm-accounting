import {
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Body,
  Delete,
} from '@nestjs/common';

import { RbacService } from './rbac.service';

@Controller('rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}
  @Post('roles')
  createRole(@Body() dto: any) {
    return this.rbacService.createRole(dto);
  }

  @Patch('roles/:id')
  updateRole(@Param('id') id: string, @Body() dto: any) {
    return this.rbacService.updateRole(id, dto);
  }

  @Delete('roles/:id')
  deleteRole(@Param('id') id: string) {
    return this.rbacService.deleteRole(id);
  }
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
