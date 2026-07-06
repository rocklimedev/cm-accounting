import { baseApi } from "./base.api";

export const cashApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ==========================================================
    // Cash Transactions
    // ==========================================================

    // GET /cash/transactions
    getCashTransactions: builder.query({
      query: () => "/cash/transactions",
      providesTags: ["Cash"],
    }),

    // GET /cash/transactions/:id
    getCashTransactionById: builder.query({
      query: (id) => `/cash/transactions/${id}`,
      providesTags: (result, error, id) => [{ type: "Cash", id }],
    }),

    // POST /cash/transactions
    createCashTransaction: builder.mutation({
      query: (data) => ({
        url: "/cash/transactions",
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
        url: "/cash/openings",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["CashOpening", "CashSummary"],
    }),

    // GET /cash/openings/latest
    getLatestCashOpening: builder.query({
      query: () => "/cash/openings/latest",
      providesTags: ["CashOpening"],
    }),

    // GET /cash/openings?date=YYYY-MM-DD
    getCashOpening: builder.query({
      query: (date) => ({
        url: "/cash/openings",
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
        url: "/cash/adjustments",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["CashAdjustment", "CashSummary"],
    }),

    // GET /cash/adjustments?date=YYYY-MM-DD
    getCashAdjustments: builder.query({
      query: (date) => ({
        url: "/cash/adjustments",
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
        url: "/cash/summary",
        params: { date },
      }),
      providesTags: ["CashSummary"],
    }),
  }),

  overrideExisting: false,
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
