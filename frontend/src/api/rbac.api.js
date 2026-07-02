import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BACKEND_URL = "http://localhost:3005"; // Replace with your backend URL

export const rbacApi = createApi({
  reducerPath: "rbacApi",

  baseQuery: fetchBaseQuery({
    baseUrl: `${BACKEND_URL}/rbac`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("erp_token");

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return headers;
    },
  }),

  tagTypes: ["Role"],

  endpoints: (builder) => ({
    // GET /rbac/roles
    getRoles: builder.query({
      query: () => "/roles",
      providesTags: ["Role"],
    }),

    // GET /rbac/roles/:id
    getRoleById: builder.query({
      query: (id) => `/roles/${id}`,
      providesTags: (result, error, id) => [{ type: "Role", id }],
    }),

    // GET /rbac/roles/:id/permissions
    getRolePermissions: builder.query({
      query: (id) => `/roles/${id}/permissions`,
      providesTags: (result, error, id) => [{ type: "Role", id }],
    }),
  }),
});

export const {
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useGetRolePermissionsQuery,
} = rbacApi;
