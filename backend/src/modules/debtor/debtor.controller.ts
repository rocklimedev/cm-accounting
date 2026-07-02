import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { DebtorService } from './debtor.service';

import { CreateDebtorTransactionDto } from './dto/create-debtor-transaction.dto';
import { CreateDebtorReportDto } from './dto/create-debtor-report.dto';
import { CreateDebtorEntryDto } from './dto/create-debtor-entry.dto';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.ACCOUNTANT)
@Controller('debtors')
export class DebtorController {
  constructor(private readonly debtorService: DebtorService) {}

  // =====================================
  // Transactions
  // =====================================

  @Get('transactions')
  findAllTransactions(@Query('customer_name') customer_name?: string) {
    return this.debtorService.findAll(customer_name);
  }

  @Get('transactions/:id')
  findTransaction(@Param('id') id: string) {
    return this.debtorService.findOne(id);
  }

  @Get('balance/:customer_name')
  getBalance(@Param('customer_name') customer_name: string) {
    return this.debtorService.getBalance(customer_name);
  }

  @Post('transactions')
  createTransaction(
    @Body() dto: CreateDebtorTransactionDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.debtorService.createTransaction(dto, userId);
  }

  // =====================================
  // Reports
  // =====================================

  @Post('reports')
  createReport(
    @Body() dto: CreateDebtorReportDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.debtorService.createReport(dto, userId);
  }

  @Get('reports/latest')
  getLatestReport() {
    return this.debtorService.getLatestReport();
  }

  @Get('reports')
  getReport(@Query('date') date: string) {
    return this.debtorService.getReport(date);
  }

  @Get('reports/summary')
  getReportSummary(@Query('date') date: string) {
    return this.debtorService.getReportSummary(date);
  }

  // =====================================
  // Entries
  // =====================================

  @Post('entries')
  createEntry(
    @Body() dto: CreateDebtorEntryDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.debtorService.createEntry(dto, userId);
  }

  @Get('entries/:reportId')
  getEntries(@Param('reportId') reportId: string) {
    return this.debtorService.getEntries(reportId);
  }
}
