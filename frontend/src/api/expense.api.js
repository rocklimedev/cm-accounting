import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BACKEND_URL = "http://localhost:3005/api/v1"; // Replace with your backend URL

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

  tagTypes: ["Expense", "ExpenseTitle", "Draft"],

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

    // POST /expenses  — always creates as DRAFT (per ExpenseService.create)
    createExpense: builder.mutation({
      query: (data) => ({
        url: "/expenses",
        method: "POST",
        body: data, // { report_date, items: [{ expense_title, amount, payment_mode }] }
      }),
      invalidatesTags: ["Expense"],
    }),

    // POST /expenses/:id/post — DRAFT -> POSTED
    postExpense: builder.mutation({
      query: (id) => ({
        url: `/expenses/${id}/post`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        "Expense",
        "Draft",
        { type: "Expense", id },
      ],
    }),

    // POST /expenses/:id/void
    voidExpense: builder.mutation({
      query: (id) => ({
        url: `/expenses/${id}/void`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        "Expense",
        "Draft",
        { type: "Expense", id },
      ],
    }),

    // GET /expenses/titles — matches ExpenseService.getExpenseTitles()
    // Adjust the path here if your controller mounts it elsewhere.
    getExpenseTitles: builder.query({
      query: () => "/expenses/titles",
      providesTags: ["ExpenseTitle"],
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
  useGetExpenseTitlesQuery,
  useGetDraftReportsQuery,
} = expenseApi;
