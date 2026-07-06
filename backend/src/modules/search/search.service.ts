import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { DebtorReport } from '../debtor/models/debtor-reports.model';
import { ExpenseReport } from '../expense/models/expense-report.model';
import { SalesReport } from '../sales/models/sales-report.model';
import { User } from '../users/models/user.model';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(DebtorReport)
    private debtorRepo: typeof DebtorReport,

    @InjectModel(ExpenseReport)
    private expenseRepo: typeof ExpenseReport,

    @InjectModel(SalesReport)
    private salesRepo: typeof SalesReport,
  ) {}

  async search({
    q,
    type,
    status,
    page,
    limit,
  }: {
    q?: string;
    type?: string;
    status?: string;
    page: number;
    limit: number;
  }) {
    const offset = (page - 1) * limit;

    if (type === 'debtor') {
      return this.searchDebtor(q, status, limit, offset);
    }

    if (type === 'expense') {
      return this.searchExpense(q, status, limit, offset);
    }

    if (type === 'sales') {
      return this.searchSales(q, status, limit, offset);
    }

    const [debtor, expense, sales] = await Promise.all([
      this.searchDebtor(q, status),
      this.searchExpense(q, status),
      this.searchSales(q, status),
    ]);

    return {
      debtor,
      expense,
      sales,
    };
  }

  private async searchDebtor(
    q?: string,
    status?: string,
    limit?: number,
    offset?: number,
  ) {
    const where: any = {};

    if (q) {
      where.debtorNo = {
        [Op.like]: `%${q}%`,
      };
    }

    if (status) {
      where.status = status;
    }

    return this.debtorRepo.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
  }

  private async searchExpense(
    q?: string,
    status?: string,
    limit?: number,
    offset?: number,
  ) {
    const where: any = {};

    if (q) {
      where.expense_no = {
        [Op.like]: `%${q}%`,
      };
    }

    if (status) {
      where.status = status;
    }

    return this.expenseRepo.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name'],
        },
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });
  }

  private async searchSales(
    q?: string,
    status?: string,
    limit?: number,
    offset?: number,
  ) {
    const where: any = {};

    if (q) {
      where.sales_no = {
        [Op.like]: `%${q}%`,
      };
    }

    if (status) {
      where.status = status;
    }

    return this.salesRepo.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name'],
        },
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });
  }
}
