import { baseApi } from "./base.api";

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ---------------- Reports ----------------

    getReports: builder.query({
      query: (params = {}) => ({
        url: "/reports",
        params,
      }),
      providesTags: ["Report"],
    }),

    getReport: builder.query({
      query: ({ id, type }) => ({
        url: `/reports/${id}`,
        params: { type },
      }),
      providesTags: (_result, _error, { id }) => [{ type: "Report", id }],
    }),

    getDraftReports: builder.query({
      query: () => ({
        url: "/reports/drafts",
      }),
      providesTags: ["Report"],
    }),

    // ---------------- Dashboard ----------------

    getDashboard: builder.query({
      query: (params = {}) => ({
        url: "/reports/dashboard",
        params,
      }),
      providesTags: ["Dashboard"],
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetReportsQuery,
  useGetReportQuery,
  useGetDraftReportsQuery,
  useGetDashboardQuery,
} = reportsApi;
