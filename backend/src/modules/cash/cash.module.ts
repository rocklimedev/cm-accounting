import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { CashTransaction } from './models/cash-transaction.model';
import { CashOpening } from './models/cash-openings.model';
import { CashAdjustment } from './models/cash-adjustments.model';

import { CashService } from './cash.service';
import { CashController } from './cash.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    SequelizeModule.forFeature([CashTransaction, CashOpening, CashAdjustment]),
    AuditModule,
  ],
  controllers: [CashController],
  providers: [CashService],
  exports: [CashService],
})
export class CashModule {}
