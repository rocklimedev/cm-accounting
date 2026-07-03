import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BACKEND_URL = "http://localhost:3005/api/v1"; // Replace with your backend URL

export const bankApi = createApi({
  reducerPath: "bankApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${BACKEND_URL}/bank`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("erp_token");

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return headers;
    },
  }),

  tagTypes: ["Bank"],

  endpoints: (builder) => ({
    // GET /bank
    getBanks: builder.query({
      query: () => "",
      providesTags: ["Bank"],
    }),

    // GET /bank/:id
    getBankById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: "Bank", id }],
    }),

    // POST /bank
    createBankTransaction: builder.mutation({
      query: (data) => ({
        url: "",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Bank"],
    }),
  }),
});

export const {
  useGetBanksQuery,
  useGetBankByIdQuery,
  useCreateBankTransactionMutation,
} = bankApi;
