import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BACKEND_URL = "http://localhost:3005";

export const reportsApi = createApi({
  reducerPath: "reportsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${BACKEND_URL}`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("erp_token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),

  tagTypes: ["Report"],

  endpoints: (builder) => ({
    // GET reports with filters & pagination
    getReports: builder.query({
      query: (params) => {
        const searchParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== "" && value !== "all") {
            searchParams.append(key, String(value));
          }
        });

        return `/reports?${searchParams.toString()}`;
      },
      providesTags: ["Report"],
    }),

    // Export Excel
    exportReportsExcel: builder.mutation({
      query: (params) => ({
        url: "/export/reports/excel",
        method: "GET",
        params, // RTK Query will append as query string
        responseHandler: (response) => response.blob(), // for file download
      }),
    }),
  }),
});

export const { useGetReportsQuery, useExportReportsExcelMutation } = reportsApi;
