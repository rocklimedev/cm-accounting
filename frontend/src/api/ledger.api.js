import { baseApi } from "./base.api";

export const ledgerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /ledger
    getLedgerEntries: builder.query({
      query: (params = {}) => ({
        url: "/ledger",
        params: {
          ...(params.from && { from: params.from }),
          ...(params.to && { to: params.to }),
          ...(params.account_name && {
            account_name: params.account_name,
          }),
        },
      }),
      providesTags: ["Ledger"],
    }),

    // GET /ledger/:id
    getLedgerEntryById: builder.query({
      query: (id) => `/ledger/${id}`,
      providesTags: (result, error, id) => [{ type: "Ledger", id }],
    }),

    // POST /ledger
    createLedgerEntry: builder.mutation({
      query: (data) => ({
        url: "/ledger",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Ledger"],
    }),

    // POST /ledger/:id/reverse
    reverseLedgerEntry: builder.mutation({
      query: (id) => ({
        url: `/ledger/${id}/reverse`,
        method: "POST",
      }),
      invalidatesTags: ["Ledger"],
    }),

    // GET /reconciliation
    getReconciliation: builder.query({
      query: (params = {}) => ({
        url: "/reconciliation",
        params: {
          ...(params.timeline && { timeline: params.timeline }),
          ...(params.start && { start: params.start }),
          ...(params.end && { end: params.end }),
        },
      }),
      providesTags: ["Reconciliation"],
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetLedgerEntriesQuery,
  useGetLedgerEntryByIdQuery,
  useCreateLedgerEntryMutation,
  useReverseLedgerEntryMutation,
  useGetReconciliationQuery,
} = ledgerApi;
