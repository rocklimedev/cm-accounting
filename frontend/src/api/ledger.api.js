import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BACKEND_URL = "http://localhost:3005/api/v1"; // Replace with your backend URL

export const ledgerApi = createApi({
  reducerPath: "ledgerApi",

  baseQuery: fetchBaseQuery({
    baseUrl: BACKEND_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("erp_token");

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return headers;
    },
  }),

  tagTypes: ["Ledger", "Reconciliation"],

  endpoints: (builder) => ({
    // GET /ledger
    getLedgerEntries: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();

        if (params.from) searchParams.append("from", params.from);
        if (params.to) searchParams.append("to", params.to);
        if (params.account_name)
          searchParams.append("account_name", params.account_name);

        const queryString = searchParams.toString();

        return `/ledger${queryString ? `?${queryString}` : ""}`;
      },
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
    // params: { timeline: "this_month" | "custom" | "date_to_date" | ..., start?, end? }
    getReconciliation: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();

        if (params.timeline) searchParams.append("timeline", params.timeline);
        if (params.start) searchParams.append("start", params.start);
        if (params.end) searchParams.append("end", params.end);

        const queryString = searchParams.toString();

        return `/reconciliation${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["Reconciliation"],
    }),
  }),
});

export const {
  useGetLedgerEntriesQuery,
  useGetLedgerEntryByIdQuery,
  useCreateLedgerEntryMutation,
  useReverseLedgerEntryMutation,
  useGetReconciliationQuery,
} = ledgerApi;
