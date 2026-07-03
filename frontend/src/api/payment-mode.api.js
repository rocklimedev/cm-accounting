import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BACKEND_URL = "http://localhost:3005/api/v1";

const baseQuery = fetchBaseQuery({
  baseUrl: BACKEND_URL,
});

export const paymentModeApi = createApi({
  reducerPath: "paymentModeApi",
  baseQuery,
  tagTypes: ["PaymentMode"],
  endpoints: (builder) => ({
    // Get all payment modes
    getPaymentModes: builder.query({
      query: () => "/payment-modes",
      providesTags: ["PaymentMode"],
    }),

    // Get active payment modes
    getActivePaymentModes: builder.query({
      query: () => "/payment-modes/active",
      providesTags: ["PaymentMode"],
    }),

    // Get one payment mode
    getPaymentMode: builder.query({
      query: (id) => `/payment-modes/${id}`,
      providesTags: (_result, _error, id) => [{ type: "PaymentMode", id }],
    }),

    // Create
    createPaymentMode: builder.mutation({
      query: (body) => ({
        url: "/payment-modes",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PaymentMode"],
    }),

    // Update
    updatePaymentMode: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/payment-modes/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "PaymentMode",
        { type: "PaymentMode", id },
      ],
    }),

    // Delete
    deletePaymentMode: builder.mutation({
      query: (id) => ({
        url: `/payment-modes/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["PaymentMode"],
    }),

    // ==================== NEW: PAYMENT MODE RECONCILIATION REPORT ====================
    getPaymentModeReport: builder.query({
      query: (params) => ({
        url: "/payment-modes/report/payment-modes",
        params: {
          from: params?.from,
          to: params?.to,
          includeInactive: params?.includeInactive,
        },
      }),
      providesTags: ["PaymentMode"], // You can create a separate tag like "PaymentModeReport" if needed
    }),
  }),
});

export const {
  useGetPaymentModesQuery,
  useGetActivePaymentModesQuery,
  useGetPaymentModeQuery,
  useCreatePaymentModeMutation,
  useUpdatePaymentModeMutation,
  useDeletePaymentModeMutation,
  // New export
  useGetPaymentModeReportQuery,
} = paymentModeApi;
