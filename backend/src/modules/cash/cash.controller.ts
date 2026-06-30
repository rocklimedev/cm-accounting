import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CashService } from './cash.service';
import { CreateCashTransactionDto } from './dto/create-cash-transaction.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.ACCOUNTANT)
@Controller('cash')
export class CashController {
  constructor(private cashService: CashService) {}

  @Get()
  findAll() {
    return this.cashService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cashService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCashTransactionDto, @CurrentUser('userId') userId: string) {
    return this.cashService.create(dto, userId);
  }
}
