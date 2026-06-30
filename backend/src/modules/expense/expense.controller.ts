import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { CreateExpenseReportDto } from './dto/create-expense-report.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('expenses')
export class ExpenseController {
  constructor(private expenseService: ExpenseService) {}

  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @Get()
  findAll() {
    return this.expenseService.findAll();
  }

  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expenseService.findOne(id);
  }

  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @Post()
  create(@Body() dto: CreateExpenseReportDto, @CurrentUser('userId') userId: string) {
    return this.expenseService.create(dto, userId);
  }

  @Roles(Role.ADMIN)
  @Post(':id/post')
  post(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.expenseService.post(id, userId);
  }

  @Roles(Role.ADMIN)
  @Post(':id/void')
  voidReport(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.expenseService.voidReport(id, userId);
  }
}
