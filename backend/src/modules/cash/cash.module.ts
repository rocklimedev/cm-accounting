import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CashTransaction } from './models/cash-transaction.model';
import { CashService } from './cash.service';
import { CashController } from './cash.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [SequelizeModule.forFeature([CashTransaction]), AuditModule],
  providers: [CashService],
  controllers: [CashController],
})
export class CashModule {}
