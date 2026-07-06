import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { CashTransaction } from './models/cash-transaction.model';
import { CashOpening } from './models/cash-openings.model';
import { CashAdjustment } from './models/cash-adjustments.model';

import { CashService } from './cash.service';
import { CashController } from './cash.controller';
import { AuditModule } from '../audit/audit.module';
import { PaymentLedgerModule } from '../payment-ledger/payment-ledger.module';
import { PaymentModeModule } from '../bank/payment-mode.module';

@Module({
  imports: [
    SequelizeModule.forFeature([CashTransaction, CashOpening, CashAdjustment]),
    AuditModule,
    PaymentLedgerModule,
    PaymentModeModule,
  ],
  controllers: [CashController],
  providers: [CashService],
  exports: [CashService],
})
export class CashModule {}
