import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { PaymentMode } from './models/payment-mode.model';
import { PaymentModeController } from './payment-mode.controller';
import { PaymentModeService } from './payment-mode.service';
import { AuditModule } from '../audit/audit.module';
import { ReconciliationService } from './reconcilation.service';
import { PaymentLedgerModule } from '../payment-ledger/payment-ledger.module';

@Module({
  imports: [
    SequelizeModule.forFeature([PaymentMode]),
    AuditModule,
    PaymentLedgerModule,
  ],
  controllers: [PaymentModeController],
  providers: [PaymentModeService, ReconciliationService],
  exports: [
    PaymentModeService,
    SequelizeModule, // <-- Add this
  ],
})
export class PaymentModeModule {}
