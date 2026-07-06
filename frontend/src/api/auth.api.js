import { baseApi } from "./base.api";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),

    register: builder.mutation({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
    }),
  }),

  overrideExisting: false,
});

export const { useLoginMutation, useRegisterMutation } = authApi;
