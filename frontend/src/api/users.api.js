import { baseApi } from "./base.api";

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /users
    getUsers: builder.query({
      query: () => "/users",
      providesTags: ["User"],
    }),

    // GET /users/:id
    getUserById: builder.query({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: "User", id }],
    }),

    // GET /users/email/:email
    getUserByEmail: builder.query({
      query: (email) => ({
        url: `/users/email/${email}`,
      }),
      providesTags: (result, error, email) => [{ type: "User", id: email }],
    }),

    // POST /users
    createUser: builder.mutation({
      query: (data) => ({
        url: "/users",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    // PUT /users/:id
    updateUser: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/users/${id}`,
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
        url: `/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useGetUserByEmailQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = usersApi;
