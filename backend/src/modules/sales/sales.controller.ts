import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSalesReportDto } from './dto/create-sales-report.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(private salesService: SalesService) {}

  @Get()
  findAll() {
    return this.salesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  @Post()
  create(
    @Body() dto: CreateSalesReportDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.salesService.create(dto, userId);
  }

  @Post(':id/post')
  post(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.salesService.post(id, userId);
  }

  @Post(':id/void')
  voidReport(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.salesService.voidReport(id, userId);
  }
}
