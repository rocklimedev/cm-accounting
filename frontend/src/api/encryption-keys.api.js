import { baseApi } from "./base.api";

export const encryptionKeysApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEncryptionKeys: builder.query({
      query: () => "/encryption-keys",
      providesTags: ["EncryptionKey"],
    }),
    recordActiveEncryptionKey: builder.mutation({
      query: () => ({
        url: "/encryption-keys/record-active",
        method: "POST",
      }),
      invalidatesTags: ["EncryptionKey"],
    }),
  }),
});

export const {
  useGetEncryptionKeysQuery,
  useRecordActiveEncryptionKeyMutation,
} = encryptionKeysApi;
