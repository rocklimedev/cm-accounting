import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SalesReport } from './models/sales-report.model';
import { SalesReportItem } from './models/sales-report-item.model';
import { PaymentMode } from '@/modules/bank/models/payment-mode.model';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { AuditModule } from '../audit/audit.module';
import { CryptoModule } from '../crypto/crypto.module';
import { PaymentLedgerModule } from '../payment-ledger/payment-ledger.module';

@Module({
  imports: [
    SequelizeModule.forFeature([SalesReport, SalesReportItem, PaymentMode]),
    AuditModule,
    CryptoModule,
    PaymentLedgerModule,
  ],
  providers: [SalesService],
  controllers: [SalesController],
})
export class SalesModule {}
