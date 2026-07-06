import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { ExpenseReport } from '../expense/models/expense-report.model';
import { SalesReport } from '../sales/models/sales-report.model';
import { DebtorReport } from '../debtor/models/debtor-reports.model';
import { User } from '../users/models/user.model';

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

  // =====================================
  // GET REPORTS
  // =====================================
  async getReports(query: any, userId?: string) {
    const {
      report_type = 'all',
      search = '',
      status = 'all',
      page = 1,
      page_size = 20,
      min_amount,
      max_amount,
      mine = false,
    } = query;

    const rows: any[] = [];

    // =====================================
    // SALES
    // =====================================
    if (report_type === 'all' || report_type === 'sales') {
      const where: any = {};
      if (mine && userId) where.created_by = userId;

      const sales = await this.salesModel.findAll({
        where,
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name'],
          },
        ],
      });

      rows.push(
        ...sales.map((r) => ({
          report_id: r.id,
          report_no: r.sales_no,
          report_date: r.report_date,
          report_type: 'sales',

          main_amount: Number(r.gross_amount),

          created_by: r.created_by,
          created_by_name: (r as any).creator?.name || '-',

          submitted_at: r.created_at,
          updated_at: r.created_at,

          status: r.status,
        })),
      );
    }

    // =====================================
    // EXPENSE
    // =====================================
    if (report_type === 'all' || report_type === 'expense') {
      const where: any = {};
      if (mine && userId) where.created_by = userId;

      const expenses = await this.expenseModel.findAll({
        where,
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name'],
          },
        ],
      });

      rows.push(
        ...expenses.map((r) => ({
          report_id: r.id,
          report_no: r.expense_no,
          report_date: r.report_date,
          report_type: 'expense',

          main_amount: Number(r.total_amount),

          created_by: r.created_by,
          created_by_name: (r as any).creator?.name || '-',

          submitted_at: r.created_at,
          updated_at: r.created_at,

          status: r.status,
        })),
      );
    }

    // =====================================
    // DEBTOR
    // =====================================
    if (report_type === 'all' || report_type === 'debtor') {
      const where: any = {};
      if (mine && userId) where.created_by = userId;

      const debtors = await this.debtorModel.findAll({
        where,
      });

      rows.push(
        ...debtors.map((r) => ({
          report_id: r.id,
          report_no: r.debtorNo,
          report_date: r.reportDate,
          report_type: 'debtor',

          main_amount: Number(r.closingAmount),

          created_by: r.submittedBy,
          created_by_name: '-',

          submitted_by: r.submittedBy,
          submitted_at: r.createdAt,
          updated_at: r.createdAt,

          status: r.status,
        })),
      );
    }

    // =====================================
    // FILTERING
    // =====================================
    let filtered = rows;

    if (search) {
      const s = search.toLowerCase();

      filtered = filtered.filter(
        (r) =>
          r.report_id.toLowerCase().includes(s) ||
          r.report_type.toLowerCase().includes(s) ||
          (r.created_by_name || '').toLowerCase().includes(s),
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

  // =====================================
  // DASHBOARD (unchanged logic)
  // =====================================
  // reports.service.ts
  async dashboard(query: any) {
    const {
      timeline = 'this_month',
      start: customStart,
      end: customEnd,
    } = query;

    const now = new Date();
    let dateStart: Date;
    let dateEnd: Date = new Date(now);

    // Date Range Logic
    switch (timeline) {
      case 'today':
        dateStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'yesterday':
        dateStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 1,
        );
        dateEnd = dateStart;
        break;
      case 'this_week':
        dateStart = new Date(now);
        dateStart.setDate(now.getDate() - now.getDay());
        break;
      case 'last_week':
        dateStart = new Date(now);
        dateStart.setDate(now.getDate() - now.getDay() - 7);
        dateEnd = new Date(dateStart);
        dateEnd.setDate(dateEnd.getDate() + 6);
        break;
      case 'this_month':
        dateStart = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'last_month':
        dateStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        dateEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'last_3_months':
        dateStart = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case 'last_6_months':
        dateStart = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        break;
      case 'custom':
      case 'date_to_date':
        if (customStart && customEnd) {
          dateStart = new Date(customStart);
          dateEnd = new Date(customEnd);
        } else {
          dateStart = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        break;
      default:
        dateStart = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const dateFilter = { [Op.between]: [dateStart, dateEnd] };

    // Fetch all data in parallel
    const [sales, expenses, debtors] = await Promise.all([
      this.salesModel.findAll({
        where: { report_date: dateFilter },
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name'],
          },
        ],
      }),

      this.expenseModel.findAll({
        where: { report_date: dateFilter },
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name'],
          },
        ],
      }),

      this.debtorModel.findAll({
        where: { reportDate: dateFilter },
      }),
    ]);

    // ====================== CARDS ======================
    const retailSales = sales.reduce(
      (sum, s) => sum + Number(s.gross_amount || 0),
      0,
    );
    const totalExpenses = expenses.reduce(
      (sum, e) => sum + Number(e.total_amount || 0),
      0,
    );
    const debtorReceived = debtors.reduce(
      (sum, d) => sum + Number(d.receivedTotal || 0),
      0,
    );
    const newDebtorAdded = debtors.reduce(
      (sum, d) => sum + Number(d.newDebtorTotal || 0),
      0,
    );
    const outstandingDebtor = debtors.reduce(
      (sum, d) => sum + Number(d.closingAmount || 0),
      0,
    );

    const netCashInHand = retailSales + debtorReceived - totalExpenses;

    // ====================== RECENT REPORTS ======================
    const recentReports = [
      ...sales.map((s) => ({
        report_id: s.id,
        report_date: s.report_date,
        report_type: 'sales',
        submitted_by_name: s.creator?.name || '-',
        amount: Number(s.gross_amount || 0),
        status: s.status,
      })),
      ...expenses.map((e) => ({
        report_id: e.id,
        report_date: e.report_date,
        report_type: 'expense',
        submitted_by_name: e.creator?.name || '-',
        amount: Number(e.total_amount || 0),
        status: e.status,
      })),
      ...debtors.map((d) => ({
        report_id: d.id,
        report_date: d.reportDate,
        report_type: 'debtor',
        submitted_by_name: '-', // Add User relation later if needed
        amount: Number(d.closingAmount || 0),
        status: d.status,
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.report_date).getTime() - new Date(a.report_date).getTime(),
      )
      .slice(0, 10);

    // ====================== DEBTOR TREND ======================
    const debtorTrend = {
      opening: debtors.reduce(
        (sum, d) => sum + Number(d.openingAmount || 0),
        0,
      ),
      new_debtor: newDebtorAdded,
      received: debtorReceived,
      closing: outstandingDebtor,
    };

    // ====================== PAYMENT MODE (Placeholder - Improve later) ======================
    const paymentReceipts = [
      {
        key: 'cash',
        label: 'Cash',
        amount: Math.round((retailSales + debtorReceived) * 0.55),
      },
      {
        key: 'bank',
        label: 'Bank',
        amount: Math.round((retailSales + debtorReceived) * 0.35),
      },
      {
        key: 'upi',
        label: 'UPI / Digital',
        amount: Math.round((retailSales + debtorReceived) * 0.1),
      },
    ];

    const paymentModeSummary = [
      {
        key: 'cash',
        label: 'Cash',
        net_movement: Math.round(netCashInHand * 0.6),
      },
      {
        key: 'bank',
        label: 'Bank Transfer',
        net_movement: Math.round(netCashInHand * 0.35),
      },
      {
        key: 'upi',
        label: 'Digital Payment',
        net_movement: Math.round(netCashInHand * 0.05),
      },
    ];

    return {
      cards: {
        cash_opening: 0, // Implement proper opening balance logic later
        retail_sales: retailSales,
        debtor_received: debtorReceived,
        outstanding_debtor: outstandingDebtor,
        total_expenses: totalExpenses,
        net_cash_in_hand: netCashInHand,
        total_realised_sales: retailSales + debtorReceived,
        new_debtor_added: newDebtorAdded,
        new_debtor_last_date: debtors.length
          ? debtors[debtors.length - 1].reportDate
          : null,
        draft_count: await this.getDraftCount(), // Optional helper
      },
      debtor_trend: debtorTrend,
      series: [], // TODO: Implement daily/weekly series if needed

      payment_mode_summary: paymentModeSummary,
      recent_reports: recentReports,
    };
  }

  // Optional helper
  private async getDraftCount() {
    const [salesDrafts, expenseDrafts, debtorDrafts] = await Promise.all([
      this.salesModel.count({ where: { status: 'DRAFT' } }),
      this.expenseModel.count({ where: { status: 'DRAFT' } }),
      this.debtorModel.count({ where: { status: 'draft' } }),
    ]);
    return salesDrafts + expenseDrafts + debtorDrafts;
  }

  // =====================================
  // DRAFT REPORTS (optional enhancement)
  // =====================================
  async getDraftReports() {
    const rows: any[] = [];

    const sales = await this.salesModel.findAll({
      where: { status: 'DRAFT' },
      include: [{ model: User, as: 'creator', attributes: ['id', 'name'] }],
    });

    rows.push(
      ...sales.map((r) => ({
        report_id: r.id,
        report_no: r.sales_no,
        report_type: 'sales',
        amount: Number(r.gross_amount),
        created_by_name: (r as any).creator?.name || '-',
        status: r.status,
        created_at: r.created_at,
      })),
    );

    return {
      total: rows.length,
      rows,
    };
  }
}
