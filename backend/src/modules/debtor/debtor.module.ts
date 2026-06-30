import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DebtorTransaction } from './models/debtor-transaction.model';
import { DebtorService } from './debtor.service';
import { DebtorController } from './debtor.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [SequelizeModule.forFeature([DebtorTransaction]), AuditModule],
  providers: [DebtorService],
  controllers: [DebtorController],
})
export class DebtorModule {}
