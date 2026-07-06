import { baseApi } from "./base.api";

export const debtorApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =====================================
    // TRANSACTIONS
    // =====================================

    getDebtors: builder.query({
      query: (customerName) => ({
        url: "/debtors/transactions",
        params: customerName ? { customer_name: customerName } : undefined,
      }),
      providesTags: ["Debtor"],
    }),

    getDebtorById: builder.query({
      query: (id) => `/debtors/transactions/${id}`,
      providesTags: (result, error, id) => [{ type: "Debtor", id }],
    }),

    createDebtorTransaction: builder.mutation({
      query: (data) => ({
        url: "/debtors/transactions",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Debtor"],
    }),

    // =====================================
    // BALANCE
    // =====================================

    getDebtorBalance: builder.query({
      query: (customerName) => ({
        url: "/debtors/balance",
        params: { customer_name: customerName },
      }),
      providesTags: (result, error, customerName) => [
        { type: "Debtor", id: customerName },
      ],
    }),

    getDebtorReport: builder.query({
      query: (reportId) => `/debtors/report/${reportId}`,
      providesTags: (result, error, reportId) => [
        { type: "DebtorReport", id: reportId },
      ],
    }),

    // =====================================
    // REPORTS
    // =====================================

    createDebtorReport: builder.mutation({
      query: (data) => ({
        url: "/debtors/reports",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["DebtorReport"],
    }),

    getReports: builder.query({
      query: (reportDate) => ({
        url: "/debtors/reports",
        params: reportDate ? { reportDate } : undefined,
      }),
      providesTags: ["DebtorReport"],
    }),

    getLatestReport: builder.query({
      query: () => "/debtors/reports/latest",
      providesTags: ["DebtorReport"],
    }),

    getReportSummary: builder.query({
      query: (reportDate) => ({
        url: "/debtors/reports/summary",
        params: { reportDate },
      }),
      providesTags: ["DebtorReport"],
    }),

    // =====================================
    // OUTSTANDING DEBTOR
    // =====================================

    getOutstandingDebtorAmount: builder.query({
      query: () => "/debtors/outstanding-debtor",
      providesTags: ["Debtor"],
    }),

    // =====================================
    // ENTRIES
    // =====================================

    createDebtorEntry: builder.mutation({
      query: (data) => ({
        url: "/debtors/entries",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["DebtorEntry", "DebtorReport"],
    }),

    getEntries: builder.query({
      query: (reportId) => `/debtors/entries/${reportId}`,
      providesTags: ["DebtorEntry"],
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetDebtorsQuery,
  useGetDebtorByIdQuery,
  useCreateDebtorTransactionMutation,
  useGetDebtorBalanceQuery,
  useGetDebtorReportQuery,
  useCreateDebtorReportMutation,
  useGetReportsQuery,
  useGetLatestReportQuery,
  useGetReportSummaryQuery,
  useGetOutstandingDebtorAmountQuery,
  useCreateDebtorEntryMutation,
  useGetEntriesQuery,
} = debtorApi;
