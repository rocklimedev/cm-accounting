import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BACKEND_URL = "http://localhost:3005/api/v1";

export const cashApi = createApi({
  reducerPath: "cashApi",

  baseQuery: fetchBaseQuery({
    baseUrl: `${BACKEND_URL}/cash`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("erp_token");

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return headers;
    },
  }),

  tagTypes: ["Cash", "CashOpening", "CashAdjustment", "CashSummary"],

  endpoints: (builder) => ({
    // ==========================================================
    // Cash Transactions
    // ==========================================================

    // GET /cash/transactions
    getCashTransactions: builder.query({
      query: () => "/transactions",
      providesTags: ["Cash"],
    }),

    // GET /cash/transactions/:id
    getCashTransactionById: builder.query({
      query: (id) => `/transactions/${id}`,
      providesTags: (result, error, id) => [{ type: "Cash", id }],
    }),

    // POST /cash/transactions
    createCashTransaction: builder.mutation({
      query: (data) => ({
        url: "/transactions",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Cash", "CashSummary", "CashOpening", "CashAdjustment"],
    }),

    // ==========================================================
    // Cash Opening
    // ==========================================================

    // POST /cash/openings
    createCashOpening: builder.mutation({
      query: (data) => ({
        url: "/openings",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["CashOpening", "CashSummary"],
    }),

    // GET /cash/openings/latest
    getLatestCashOpening: builder.query({
      query: () => "/openings/latest",
      providesTags: ["CashOpening"],
    }),

    // GET /cash/openings?date=YYYY-MM-DD
    getCashOpening: builder.query({
      query: (date) => ({
        url: "/openings",
        params: { date },
      }),
      providesTags: ["CashOpening"],
    }),

    // ==========================================================
    // Cash Adjustments
    // ==========================================================

    // POST /cash/adjustments
    createCashAdjustment: builder.mutation({
      query: (data) => ({
        url: "/adjustments",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["CashAdjustment", "CashSummary"],
    }),

    // GET /cash/adjustments?date=YYYY-MM-DD
    getCashAdjustments: builder.query({
      query: (date) => ({
        url: "/adjustments",
        params: { date },
      }),
      providesTags: ["CashAdjustment"],
    }),

    // ==========================================================
    // Daily Summary
    // ==========================================================

    // GET /cash/summary?date=YYYY-MM-DD
    getCashSummary: builder.query({
      query: (date) => ({
        url: "/summary",
        params: { date },
      }),
      providesTags: ["CashSummary"],
    }),
  }),
});

export const {
  // Transactions
  useGetCashTransactionsQuery,
  useGetCashTransactionByIdQuery,
  useCreateCashTransactionMutation,

  // Openings
  useCreateCashOpeningMutation,
  useGetLatestCashOpeningQuery,
  useGetCashOpeningQuery,

  // Adjustments
  useCreateCashAdjustmentMutation,
  useGetCashAdjustmentsQuery,

  // Summary
  useGetCashSummaryQuery,
} = cashApi;
