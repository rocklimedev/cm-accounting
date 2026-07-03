import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { ExpenseReport } from './models/expense-report.model';
import { ExpenseItem } from './models/expense-item.model';
import { ExpenseTitle } from './models/expense-titles.model';
import { ExpenseService } from './expense.service';
import { ExpenseController } from './expense.controller';

import { AuditModule } from '../audit/audit.module';
import { PaymentMode } from '../bank/models/payment-mode.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      ExpenseReport,
      ExpenseItem,
      ExpenseTitle,
      PaymentMode,
    ]),
    AuditModule,
  ],
  providers: [ExpenseService],
  controllers: [ExpenseController],
  exports: [ExpenseService],
})
export class ExpenseModule {}
