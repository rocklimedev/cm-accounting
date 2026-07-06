import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DailyClosing } from './models/daily-closing.model';
import { SalesReport } from '../sales/models/sales-report.model';
import { ExpenseReport } from '../expense/models/expense-report.model';
import { DebtorTransaction } from '../debtor/models/debtor-transaction.model';
import { DailyClosingService } from './daily-closing.service';
import { DailyClosingController } from './daily-closing.controller';
import { AuditModule } from '../audit/audit.module';
import { PaymentLedgerModule } from '../payment-ledger/payment-ledger.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      DailyClosing,
      SalesReport,
      ExpenseReport,
      DebtorTransaction,
    ]),
    AuditModule,
    PaymentLedgerModule,
  ],
  providers: [DailyClosingService],
  controllers: [DailyClosingController],
})
export class DailyClosingModule {}
