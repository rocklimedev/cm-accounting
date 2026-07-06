import { baseApi } from "./base.api";

export const expenseApi = baseApi.injectEndpoints({
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
      invalidatesTags: ["Expense", "Draft"],
    }),

    // POST /expenses/:id/post
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

    // GET /expenses/titles
    getExpenseTitles: builder.query({
      query: () => "/expenses/titles",
      providesTags: ["ExpenseTitle"],
    }),

    // GET /drafts
    getDraftReports: builder.query({
      query: () => "/drafts",
      transformResponse: (response) => response.rows ?? response,
      providesTags: ["Draft"],
    }),
  }),

  overrideExisting: false,
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
