import { baseApi } from "./base.api";

export const rbacApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRoles: builder.query({
      query: () => "/rbac/roles",
      providesTags: ["Role"],
    }),

    getRoleById: builder.query({
      query: (id) => `/rbac/roles/${id}`,
      providesTags: (r, e, id) => [{ type: "Role", id }],
    }),

    getRolePermissions: builder.query({
      query: (id) => `/rbac/roles/${id}/permissions`,
      providesTags: (r, e, id) => [{ type: "Role", id }],
    }),

    createRole: builder.mutation({
      query: (body) => ({
        url: "/rbac/roles",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Role"],
    }),

    updateRole: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/rbac/roles/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Role"],
    }),

    deleteRole: builder.mutation({
      query: (id) => ({
        url: `/rbac/roles/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Role"],
    }),
  }),
});

export const {
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useGetRolePermissionsQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} = rbacApi;
