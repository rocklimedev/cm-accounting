import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { PaymentMode } from './models/payment-mode.model';
import { PaymentModeController } from './payment-mode.controller';
import { PaymentModeService } from './payment-mode.service';
import { AuditModule } from '../audit/audit.module';
import { ReconciliationService } from './reconcilation.service';

import { ExpenseItem } from '../expense/models/expense-item.model';
import { DebtorEntry } from '@/modules/debtor/models/debtor-entries.model';

@Module({
  imports: [
    SequelizeModule.forFeature([PaymentMode, ExpenseItem, DebtorEntry]),
    AuditModule,
  ],
  controllers: [PaymentModeController],
  providers: [PaymentModeService, ReconciliationService],
  exports: [PaymentModeService],
})
export class PaymentModeModule {}
