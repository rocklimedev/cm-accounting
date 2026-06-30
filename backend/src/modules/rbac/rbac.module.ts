import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { RbacController } from './rbac.controller';
import { RbacService } from './rbac.service';
import { Role } from './models/role.model';
import { RolePermission } from './models/role-permission.model';
import { User } from '../users/models/user.model';

@Module({
  imports: [SequelizeModule.forFeature([Role, RolePermission, User])],
  controllers: [RbacController],
  providers: [RbacService],
  exports: [RbacService],
})
export class RbacModule {}
