import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { ExpenseService } from './expense.service';

import { CreateExpenseReportDto } from './dto/create-expense-report.dto';
import { CreateExpenseTitleDto } from './dto/create-expense-title.dto';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  // =============================
  // Expense Titles
  // =============================

  @Get('titles')
  getExpenseTitles() {
    return this.expenseService.getExpenseTitles();
  }

  @Get('titles/:id')
  getExpenseTitle(@Param('id') id: string) {
    return this.expenseService.getExpenseTitle(id);
  }

  @Post('titles')
  createExpenseTitle(
    @Body() dto: CreateExpenseTitleDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.expenseService.createExpenseTitle(dto, userId);
  }

  @Put('titles/:id')
  updateExpenseTitle(
    @Param('id') id: string,
    @Body() dto: CreateExpenseTitleDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.expenseService.updateExpenseTitle(id, dto, userId);
  }

  @Delete('titles/:id')
  deleteExpenseTitle(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.expenseService.deleteExpenseTitle(id, userId);
  }

  // =============================
  // Expense Reports
  // =============================

  @Get()
  findAll() {
    return this.expenseService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expenseService.findOne(id);
  }

  @Post()
  createReport(
    @Body() dto: CreateExpenseReportDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.expenseService.create(dto, userId);
  }

  @Post(':id/post')
  post(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.expenseService.post(id, userId);
  }

  @Post(':id/void')
  voidReport(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.expenseService.voidReport(id, userId);
  }
}
