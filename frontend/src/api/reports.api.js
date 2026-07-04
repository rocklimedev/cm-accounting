import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BACKEND_URL = "http://localhost:3005/api/v1";

export const reportsApi = createApi({
  reducerPath: "reportsApi",

  baseQuery: fetchBaseQuery({
    baseUrl: BACKEND_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("erp_token");

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return headers;
    },
  }),

  tagTypes: ["Report", "Dashboard"],

  endpoints: (builder) => ({
    // ---------------- Reports ----------------

    getReports: builder.query({
      query: (params = {}) => ({
        url: "/reports",
        method: "GET",
        params,
      }),
      providesTags: ["Report"],
    }),

    getReport: builder.query({
      query: ({ id, type }) => ({
        url: `/reports/${id}`,
        method: "GET",
        params: { type },
      }),
      providesTags: (_result, _error, { id }) => [{ type: "Report", id }],
    }),

    // ---------------- Dashboard ----------------

    getDashboard: builder.query({
      query: (params = {}) => ({
        url: "/reports/dashboard",
        method: "GET",
        params,
      }),
      providesTags: ["Dashboard"],
    }),
  }),
});

export const { useGetReportsQuery, useGetReportQuery, useGetDashboardQuery } =
  reportsApi;
