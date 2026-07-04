import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

import { ExpenseReport } from '../expense/models/expense-report.model';
import { SalesReport } from '../sales/models/sales-report.model';
import { DebtorReport } from '../debtor/models/debtor-reports.model';
@Module({
  imports: [
    SequelizeModule.forFeature([SalesReport, ExpenseReport, DebtorReport]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
