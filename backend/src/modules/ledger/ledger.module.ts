import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LedgerEntry } from './models/ledger-entry.model';
import { LedgerService } from './ledger.service';
import { LedgerController } from './ledger.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [SequelizeModule.forFeature([LedgerEntry]), AuditModule],
  providers: [LedgerService],
  controllers: [LedgerController],
})
export class LedgerModule {}
