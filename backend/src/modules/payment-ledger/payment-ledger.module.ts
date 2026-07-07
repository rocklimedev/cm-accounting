import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PaymentMode } from '@/modules/bank/models/payment-mode.model';
import { PaymentLedgerEntry } from './models/payment-ledger-entry.model';
import { PaymentLedgerService } from './payment-ledger.service';
import { PaymentLedgerController } from './payment-ledger.controller';

@Module({
  imports: [SequelizeModule.forFeature([PaymentLedgerEntry, PaymentMode])],
  providers: [PaymentLedgerService],
  controllers: [PaymentLedgerController],
  exports: [PaymentLedgerService],
})
export class PaymentLedgerModule {}
