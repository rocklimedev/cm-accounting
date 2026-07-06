import { baseApi } from "./base.api";

export const paymentModeApi = baseApi.injectEndpoints({
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

    // Payment Mode Reconciliation Report
    getPaymentModeReport: builder.query({
      query: (params = {}) => ({
        url: "/payment-modes/report/payment-modes",
        params: {
          ...(params.from && { from: params.from }),
          ...(params.to && { to: params.to }),
          ...(params.includeInactive !== undefined && {
            includeInactive: params.includeInactive,
          }),
        },
      }),
      providesTags: ["PaymentMode"],
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetPaymentModesQuery,
  useGetActivePaymentModesQuery,
  useGetPaymentModeQuery,
  useCreatePaymentModeMutation,
  useUpdatePaymentModeMutation,
  useDeletePaymentModeMutation,
  useGetPaymentModeReportQuery,
} = paymentModeApi;
