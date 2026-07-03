import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BACKEND_URL = "http://localhost:3005/api/v1"; // Replace with your backend URL

export const salesApi = createApi({
  reducerPath: "salesApi",

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

  tagTypes: ["Sales", "Draft"],

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
});
export const {
  useGetSalesQuery,
  useGetSalesReportByIdQuery,
  useCreateSalesReportMutation,
  useUpdateSalesReportMutation,
  usePostSalesReportMutation,
  useVoidSalesReportMutation,
} = salesApi;
