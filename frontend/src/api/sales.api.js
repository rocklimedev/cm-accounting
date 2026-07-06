import { baseApi } from "./base.api";

export const salesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /sales
    getSales: builder.query({
      query: () => "/sales",
      providesTags: ["Sales"],
    }),

    // GET /sales/:id
    getSalesReportById: builder.query({
      query: (id) => `/sales/${id}`,
      providesTags: (result, error, id) => [{ type: "Sales", id }],
    }),

    // POST /sales
    createSalesReport: builder.mutation({
      query: (data) => ({
        url: "/sales",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Sales", "Draft"],
    }),

    // PATCH /sales/:id
    updateSalesReport: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/sales/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Sales", id },
        "Sales",
        "Draft",
      ],
    }),

    // POST /sales/:id/post
    postSalesReport: builder.mutation({
      query: (id) => ({
        url: `/sales/${id}/post`,
        method: "POST",
      }),
      invalidatesTags: ["Sales", "Draft"],
    }),

    // POST /sales/:id/void
    voidSalesReport: builder.mutation({
      query: (id) => ({
        url: `/sales/${id}/void`,
        method: "POST",
      }),
      invalidatesTags: ["Sales", "Draft"],
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetSalesQuery,
  useGetSalesReportByIdQuery,
  useCreateSalesReportMutation,
  useUpdateSalesReportMutation,
  usePostSalesReportMutation,
  useVoidSalesReportMutation,
} = salesApi;
