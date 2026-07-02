import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BACKEND_URL = "http://localhost:3005"; // Replace with your backend URL

export const expenseApi = createApi({
  reducerPath: "expenseApi",

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

  tagTypes: ["Expense", "Draft"],

  endpoints: (builder) => ({
    // GET /expenses
    getExpenses: builder.query({
      query: () => "/expenses",
      providesTags: ["Expense"],
    }),

    // GET /expenses/:id
    getExpenseById: builder.query({
      query: (id) => `/expenses/${id}`,
      providesTags: (result, error, id) => [{ type: "Expense", id }],
    }),

    // POST /expenses
    createExpense: builder.mutation({
      query: (data) => ({
        url: "/expenses",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Expense"],
    }),

    // POST /expenses/:id/post
    postExpense: builder.mutation({
      query: (id) => ({
        url: `/expenses/${id}/post`,
        method: "POST",
      }),
      invalidatesTags: ["Expense", "Draft"],
    }),

    // POST /expenses/:id/void
    voidExpense: builder.mutation({
      query: (id) => ({
        url: `/expenses/${id}/void`,
        method: "POST",
      }),
      invalidatesTags: ["Expense", "Draft"],
    }),

    // GET /drafts — cross-report-type list (expense, debtor, retail, etc.)
    getDraftReports: builder.query({
      query: () => "/drafts",
      transformResponse: (response) => response.rows ?? response,
      providesTags: ["Draft"],
    }),
  }),
});

export const {
  useGetExpensesQuery,
  useGetExpenseByIdQuery,
  useCreateExpenseMutation,
  usePostExpenseMutation,
  useVoidExpenseMutation,
  useGetDraftReportsQuery,
} = expenseApi;
