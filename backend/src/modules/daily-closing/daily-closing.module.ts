import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DailyClosing } from './models/daily-closing.model';
import { SalesReport } from '../sales/models/sales-report.model';
import { ExpenseReport } from '../expense/models/expense-report.model';
import { CashTransaction } from '../cash/models/cash-transaction.model';
import { DebtorTransaction } from '../debtor/models/debtor-transaction.model';
import { DailyClosingService } from './daily-closing.service';
import { DailyClosingController } from './daily-closing.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      DailyClosing,
      SalesReport,
      ExpenseReport,
      CashTransaction,
      DebtorTransaction,
    ]),
    AuditModule,
  ],
  providers: [DailyClosingService],
  controllers: [DailyClosingController],
})
export class DailyClosingModule {}
