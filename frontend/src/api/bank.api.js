import { baseApi } from "./base.api";
export const bankApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /bank
    getBanks: builder.query({
      query: () => "/bank",
      providesTags: ["Bank"],
    }),

    // GET /bank/:id
    getBankById: builder.query({
      query: (id) => `/bank/${id}`,
      providesTags: (result, error, id) => [{ type: "Bank", id }],
    }),

    // POST /bank
    createBankTransaction: builder.mutation({
      query: (data) => ({
        url: "/bank",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Bank"],
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetBanksQuery,
  useGetBankByIdQuery,
  useCreateBankTransactionMutation,
} = bankApi;
