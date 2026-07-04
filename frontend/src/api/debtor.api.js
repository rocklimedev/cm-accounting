import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BACKEND_URL = "http://localhost:3005/api/v1";

export const debtorApi = createApi({
  reducerPath: "debtorApi",

  baseQuery: fetchBaseQuery({
    baseUrl: `${BACKEND_URL}/debtors`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("erp_token");

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return headers;
    },
  }),

  tagTypes: ["Debtor", "DebtorReport", "DebtorEntry"],

  endpoints: (builder) => ({
    // =====================================
    // TRANSACTIONS
    // =====================================

    getDebtors: builder.query({
      query: (customerName) =>
        customerName
          ? `/transactions?customer_name=${encodeURIComponent(customerName)}`
          : "/transactions",
      providesTags: ["Debtor"],
    }),

    getDebtorById: builder.query({
      query: (id) => `/transactions/${id}`,
      providesTags: (result, error, id) => [{ type: "Debtor", id }],
    }),

    createDebtorTransaction: builder.mutation({
      query: (data) => ({
        url: "/transactions",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Debtor"],
    }),

    // =====================================
    // BALANCE
    // =====================================

    getDebtorBalance: builder.query({
      query: (customerName) =>
        `/balance?customer_name=${encodeURIComponent(customerName)}`,
      providesTags: (result, error, customerName) => [
        { type: "Debtor", id: customerName },
      ],
    }),
    getDebtorReport: builder.query({
      query: (reportId) => `/report/${reportId}`,
      providesTags: (result, error, reportId) => [
        { type: "DebtorReport", id: reportId },
      ],
    }),

    // =====================================
    // REPORTS
    // =====================================

    createDebtorReport: builder.mutation({
      query: (data) => ({
        url: "/reports",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["DebtorReport"],
    }),

    getReports: builder.query({
      query: (reportDate) =>
        reportDate
          ? `/reports?reportDate=${encodeURIComponent(reportDate)}`
          : "/reports",
      providesTags: ["DebtorReport"],
    }),

    getLatestReport: builder.query({
      query: () => "/reports/latest",
      providesTags: ["DebtorReport"],
    }),

    getReportSummary: builder.query({
      query: (reportDate) =>
        `/reports/summary?reportDate=${encodeURIComponent(reportDate)}`,
      providesTags: ["DebtorReport"],
    }),
    // =====================================
    // OUTSTANDING DEBTOR
    // =====================================

    getOutstandingDebtorAmount: builder.query({
      query: () => "/outstanding-debtor",
      providesTags: ["Debtor"],
    }),
    // =====================================
    // ENTRIES
    // =====================================

    createDebtorEntry: builder.mutation({
      query: (data) => ({
        url: "/entries",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["DebtorEntry", "DebtorReport"],
    }),

    getEntries: builder.query({
      query: (reportId) => `/entries/${reportId}`,
      providesTags: ["DebtorEntry"],
    }),
  }),
});

// =====================================
// EXPORT HOOKS
// =====================================

export const {
  useGetDebtorsQuery,
  useGetDebtorByIdQuery,
  useCreateDebtorTransactionMutation,
  useGetDebtorBalanceQuery,

  // ✅ ADD THIS
  useGetDebtorReportQuery,
  useCreateDebtorReportMutation,
  useGetReportsQuery,
  useGetLatestReportQuery,
  useGetReportSummaryQuery,
  useGetOutstandingDebtorAmountQuery, // ✅ Add this
  useCreateDebtorEntryMutation,
  useGetEntriesQuery,
} = debtorApi;
