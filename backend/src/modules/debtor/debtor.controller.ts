import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { DebtorService } from './debtor.service';
import { CreateDebtorTransactionDto } from './dto/create-debtor-transaction.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.ACCOUNTANT)
@Controller('debtors')
export class DebtorController {
  constructor(private debtorService: DebtorService) {}

  @Get()
  findAll(@Query('customer_name') customer_name?: string) {
    return this.debtorService.findAll(customer_name);
  }

  @Get('balance/:customer_name')
  getBalance(@Param('customer_name') customer_name: string) {
    return this.debtorService.getBalance(customer_name);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.debtorService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateDebtorTransactionDto, @CurrentUser('userId') userId: string) {
    return this.debtorService.create(dto, userId);
  }
}
