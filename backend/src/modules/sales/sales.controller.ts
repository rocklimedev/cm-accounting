import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSalesReportDto } from './dto/create-sales-report.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sales')
export class SalesController {
  constructor(private salesService: SalesService) {}

  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @Get()
  findAll() {
    return this.salesService.findAll();
  }

  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  // ACCOUNTANT drafts daily sales reports
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @Post()
  create(@Body() dto: CreateSalesReportDto, @CurrentUser('userId') userId: string) {
    return this.salesService.create(dto, userId);
  }

  // Only ADMIN can post (finalize) a sales report, locking it into the hash chain
  @Roles(Role.ADMIN)
  @Post(':id/post')
  post(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.salesService.post(id, userId);
  }

  @Roles(Role.ADMIN)
  @Post(':id/void')
  voidReport(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.salesService.voidReport(id, userId);
  }
}
