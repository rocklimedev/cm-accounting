import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { DebtorTransaction } from './models/debtor-transaction.model';
import { DebtorReport } from './models/debtor-reports.model';
import { DebtorEntry } from './models/debtor-entries.model';

import { DebtorService } from './debtor.service';
import { DebtorController } from './debtor.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    SequelizeModule.forFeature([DebtorTransaction, DebtorReport, DebtorEntry]),
    AuditModule,
  ],
  controllers: [DebtorController],
  providers: [DebtorService],
  exports: [DebtorService],
})
export class DebtorModule {}
