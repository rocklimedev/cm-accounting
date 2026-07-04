import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { ExpenseReport } from '../expense/models/expense-report.model';
import { SalesReport } from '../sales/models/sales-report.model';
import { DebtorReport } from '../debtor/models/debtor-reports.model';
@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(SalesReport)
    private readonly salesModel: typeof SalesReport,

    @InjectModel(ExpenseReport)
    private readonly expenseModel: typeof ExpenseReport,

    @InjectModel(DebtorReport)
    private readonly debtorModel: typeof DebtorReport,
  ) {}
  private getTimelineRange(timeline: string) {
    const now = new Date();

    let start = new Date(now);
    let end = new Date(now);

    switch (timeline) {
      case 'today':
        break;

      case 'this_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;

      case 'last_month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;

      case 'this_week': {
        const day = now.getDay();
        start.setDate(now.getDate() - day);
        break;
      }

      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return {
      startDate: start.toISOString().substring(0, 10),
      endDate: end.toISOString().substring(0, 10),
    };
  }
  async getReports(query: any) {
    const {
      report_type = 'all',
      search = '',
      status = 'all',
      page = 1,
      page_size = 20,
      min_amount,
      max_amount,
    } = query;

    const rows: any[] = [];

    if (report_type === 'all' || report_type === 'sales') {
      const sales = await this.salesModel.findAll();

      rows.push(
        ...sales.map((r) => ({
          report_id: r.id,
          report_date: r.report_date,
          report_type: 'sales',

          main_amount: Number(r.gross_amount),

          submitted_by: null,
          submitted_by_name: '-',

          submitted_at: r.created_at,
          updated_at: r.created_at,

          status: r.status,
        })),
      );
    }

    if (report_type === 'all' || report_type === 'expense') {
      const expenses = await this.expenseModel.findAll();

      rows.push(
        ...expenses.map((r) => ({
          report_id: r.id,
          report_date: r.report_date,
          report_type: 'expense',

          main_amount: Number(r.total_amount),

          submitted_by: null,
          submitted_by_name: '-',

          submitted_at: r.created_at,
          updated_at: r.created_at,

          status: r.status,
        })),
      );
    }

    if (report_type === 'all' || report_type === 'debtor') {
      const debtors = await this.debtorModel.findAll();

      rows.push(
        ...debtors.map((r) => ({
          report_id: r.id,
          report_date: r.reportDate,
          report_type: 'debtor',

          main_amount: Number(r.closingAmount),

          submitted_by: r.submittedBy,
          submitted_by_name: '-',

          submitted_at: r.createdAt,
          updated_at: r.createdAt,

          status: r.status,
        })),
      );
    }

    let filtered = rows;

    if (search) {
      const s = search.toLowerCase();

      filtered = filtered.filter(
        (r) =>
          r.report_id.toLowerCase().includes(s) ||
          r.report_type.toLowerCase().includes(s),
      );
    }

    if (status !== 'all') {
      filtered = filtered.filter(
        (r) => r.status.toLowerCase() === status.toLowerCase(),
      );
    }

    if (min_amount) {
      filtered = filtered.filter(
        (r) => Number(r.main_amount) >= Number(min_amount),
      );
    }

    if (max_amount) {
      filtered = filtered.filter(
        (r) => Number(r.main_amount) <= Number(max_amount),
      );
    }

    filtered.sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );

    const total = filtered.length;

    const start = (Number(page) - 1) * Number(page_size);

    return {
      total,
      page: Number(page),
      page_size: Number(page_size),
      rows: filtered.slice(start, start + Number(page_size)),
    };
  }
  async dashboard(query: any) {
    const { timeline = 'this_month' } = query;

    // calculate start/end according to timeline
    const { startDate, endDate } = this.getTimelineRange(timeline);

    const sales = await this.salesModel.findAll({
      where: {
        report_date: {
          [Op.between]: [startDate, endDate],
        },
      },
    });

    const expenses = await this.expenseModel.findAll({
      where: {
        report_date: {
          [Op.between]: [startDate, endDate],
        },
      },
    });

    const debtors = await this.debtorModel.findAll({
      where: {
        reportDate: {
          [Op.between]: [startDate, endDate],
        },
      },
    });

    const retailSales = sales.reduce((t, s) => t + Number(s.gross_amount), 0);

    const totalExpenses = expenses.reduce(
      (t, e) => t + Number(e.total_amount),
      0,
    );

    const openingDebtor = debtors.reduce(
      (t, d) => t + Number(d.openingAmount),
      0,
    );

    const newDebtor = debtors.reduce((t, d) => t + Number(d.newDebtorTotal), 0);

    const debtorReceived = debtors.reduce(
      (t, d) => t + Number(d.receivedTotal),
      0,
    );

    const closingDebtor = debtors.reduce(
      (t, d) => t + Number(d.closingAmount),
      0,
    );

    const recentReports = [
      ...sales.map((r) => ({
        report_id: r.id,
        report_type: 'sales',
        report_date: r.report_date,
        amount: Number(r.gross_amount),
        status: r.status,
        submitted_by_name: '-',
        created_at: r.created_at,
      })),

      ...expenses.map((r) => ({
        report_id: r.id,
        report_type: 'expense',
        report_date: r.report_date,
        amount: Number(r.total_amount),
        status: r.status,
        submitted_by_name: '-',
        created_at: r.created_at,
      })),

      ...debtors.map((r) => ({
        report_id: r.id,
        report_type: 'debtor',
        report_date: r.reportDate,
        amount: Number(r.closingAmount),
        status: r.status,
        submitted_by_name: '-',
        created_at: r.createdAt,
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, 10);

    return {
      cards: {
        cash_opening: 0,

        retail_sales: retailSales,

        debtor_received: debtorReceived,

        outstanding_debtor: closingDebtor,

        total_expenses: totalExpenses,

        net_cash_in_hand: retailSales + debtorReceived - totalExpenses,

        total_realised_sales: retailSales + debtorReceived,

        new_debtor_added: newDebtor,

        new_debtor_last_date:
          debtors.length > 0 ? debtors[debtors.length - 1].reportDate : null,

        draft_count:
          sales.filter((s) => s.status === 'DRAFT').length +
          expenses.filter((e) => e.status === 'DRAFT').length +
          debtors.filter((d) => d.status === 'draft').length,
      },

      debtor_trend: {
        opening: openingDebtor,
        new_debtor: newDebtor,
        received: debtorReceived,
        closing: closingDebtor,
      },

      series: [
        {
          label: timeline,
          retail: retailSales,
          debtor_received: debtorReceived,
          expenses: totalExpenses,
        },
      ],

      payment_receipts: [],

      payment_mode_summary: [],

      recent_reports: recentReports,
    };
  }
}
