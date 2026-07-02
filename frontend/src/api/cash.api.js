import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BACKEND_URL = "http://localhost:3005"; // Replace with your backend URL

export const cashApi = createApi({
  reducerPath: "cashApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${BACKEND_URL}/cash`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("erp_token");

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return headers;
    },
  }),

  tagTypes: ["Cash"],

  endpoints: (builder) => ({
    // GET /cash
    getCashTransactions: builder.query({
      query: () => "",
      providesTags: ["Cash"],
    }),

    // GET /cash/:id
    getCashTransactionById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: "Cash", id }],
    }),

    // POST /cash
    createCashTransaction: builder.mutation({
      query: (data) => ({
        url: "",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Cash"],
    }),
  }),
});

export const {
  useGetCashTransactionsQuery,
  useGetCashTransactionByIdQuery,
  useCreateCashTransactionMutation,
} = cashApi;
