import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BankTransaction } from './models/bank-transaction.model';
import { BankService } from './bank.service';
import { BankController } from './bank.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [SequelizeModule.forFeature([BankTransaction]), AuditModule],
  providers: [BankService],
  controllers: [BankController],
})
export class BankModule {}
