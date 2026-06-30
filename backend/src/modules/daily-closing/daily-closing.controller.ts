import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { DailyClosingService } from './daily-closing.service';
import { CreateDailyClosingDto } from './dto/create-daily-closing.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('daily-closing')
export class DailyClosingController {
  constructor(private service: DailyClosingService) {}

  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @Get('verify')
  verifyChain() {
    return this.service.verifyChain();
  }

  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @Get(':report_date')
  findOne(@Param('report_date') report_date: string) {
    return this.service.findOne(report_date);
  }

  // Only ADMIN can close the day — irreversible financial snapshot
  @Roles(Role.ADMIN)
  @Post()
  closeDay(@Body() dto: CreateDailyClosingDto, @CurrentUser('userId') userId: string) {
    return this.service.closeDay(dto, userId);
  }
}
