import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BACKEND_URL = "http://localhost:3005"; // Replace with your backend URL

export const debtorApi = createApi({
  reducerPath: "debtorApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${BACKEND_URL}/debtors`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("erp_token");

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return headers;
    },
  }),

  tagTypes: ["Debtor"],

  endpoints: (builder) => ({
    // GET /debtors
    getDebtors: builder.query({
      query: (customerName) =>
        customerName
          ? `?customer_name=${encodeURIComponent(customerName)}`
          : "",
      providesTags: ["Debtor"],
    }),

    // GET /debtors/:id
    getDebtorById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: "Debtor", id }],
    }),

    // GET /debtors/balance/:customer_name
    getDebtorBalance: builder.query({
      query: (customerName) => `/balance/${encodeURIComponent(customerName)}`,
      providesTags: (result, error, customerName) => [
        { type: "Debtor", id: customerName },
      ],
    }),

    // POST /debtors
    createDebtorTransaction: builder.mutation({
      query: (data) => ({
        url: "",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Debtor"],
    }),
  }),
});

export const {
  useGetDebtorsQuery,
  useGetDebtorByIdQuery,
  useGetDebtorBalanceQuery,
  useCreateDebtorTransactionMutation,
} = debtorApi;
