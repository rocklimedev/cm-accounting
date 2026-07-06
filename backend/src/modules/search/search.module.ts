import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { DebtorReport } from '../debtor/models/debtor-reports.model';
import { ExpenseReport } from '../expense/models/expense-report.model';
import { SalesReport } from '../sales/models/sales-report.model';
import { User } from '../users/models/user.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      DebtorReport,
      ExpenseReport,
      SalesReport,
      User,
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
