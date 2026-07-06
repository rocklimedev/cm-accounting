import { baseApi } from "./base.api";

export const dailyClosingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /daily-closing
    getDailyClosings: builder.query({
      query: () => "/daily-closing",
      providesTags: ["DailyClosing"],
    }),

    // GET /daily-closing/verify
    verifyClosingChain: builder.query({
      query: () => "/daily-closing/verify",
    }),

    // GET /daily-closing/:report_date
    getDailyClosingByDate: builder.query({
      query: (reportDate) => `/daily-closing/${reportDate}`,
      providesTags: (result, error, reportDate) => [
        { type: "DailyClosing", id: reportDate },
      ],
    }),

    // POST /daily-closing
    closeDay: builder.mutation({
      query: (data) => ({
        url: "/daily-closing",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["DailyClosing"],
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetDailyClosingsQuery,
  useVerifyClosingChainQuery,
  useGetDailyClosingByDateQuery,
  useCloseDayMutation,
} = dailyClosingApi;
