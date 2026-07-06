import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PaymentMode } from '@/modules/bank/models/payment-mode.model';
import { PaymentLedgerEntry } from './models/payment-ledger-entry.model';
import { PaymentLedgerService } from './payment-ledger.service';

@Module({
  imports: [SequelizeModule.forFeature([PaymentLedgerEntry, PaymentMode])],
  providers: [PaymentLedgerService],
  exports: [PaymentLedgerService],
})
export class PaymentLedgerModule {}
