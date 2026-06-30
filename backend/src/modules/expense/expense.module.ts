import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ExpenseReport } from './models/expense-report.model';
import { ExpenseItem } from './models/expense-item.model';
import { ExpenseService } from './expense.service';
import { ExpenseController } from './expense.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    SequelizeModule.forFeature([ExpenseReport, ExpenseItem]),
    AuditModule,
  ],
  providers: [ExpenseService],
  controllers: [ExpenseController],
})
export class ExpenseModule {}
