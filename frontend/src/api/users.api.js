import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BACKEND_URL = "http://localhost:3005/api/v1"; // Replace with your backend URL

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${BACKEND_URL}/users`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("erp_token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),

  tagTypes: ["User"],

  endpoints: (builder) => ({
    // GET all users
    getUsers: builder.query({
      query: () => "",
      providesTags: ["User"],
    }),

    // GET /users/:id
    getUserById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: "User", id }],
    }),

    // GET /users/email/:email
    getUserByEmail: builder.query({
      query: (email) => `/email/${encodeURIComponent(email)}`,
      providesTags: (result, error, email) => [{ type: "User", id: email }],
    }),

    // POST /users
    createUser: builder.mutation({
      query: (data) => ({
        url: "",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    // PUT /users/:id
    updateUser: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "User", id },
        "User",
      ],
    }),

    // DELETE /users/:id
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useGetUserByEmailQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = usersApi;
