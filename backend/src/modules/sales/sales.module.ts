import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SalesReport } from './models/sales-report.model';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [SequelizeModule.forFeature([SalesReport]), AuditModule],
  providers: [SalesService],
  controllers: [SalesController],
})
export class SalesModule {}
