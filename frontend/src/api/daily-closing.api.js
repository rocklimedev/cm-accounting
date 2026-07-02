import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BACKEND_URL = "http://localhost:3005"; // Replace with your backend URL

export const dailyClosingApi = createApi({
  reducerPath: "dailyClosingApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${BACKEND_URL}/daily-closing`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("erp_token");

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return headers;
    },
  }),

  tagTypes: ["DailyClosing"],

  endpoints: (builder) => ({
    // GET /daily-closing
    getDailyClosings: builder.query({
      query: () => "",
      providesTags: ["DailyClosing"],
    }),

    // GET /daily-closing/verify
    verifyClosingChain: builder.query({
      query: () => "/verify",
    }),

    // GET /daily-closing/:report_date
    getDailyClosingByDate: builder.query({
      query: (reportDate) => `/${reportDate}`,
      providesTags: (result, error, reportDate) => [
        { type: "DailyClosing", id: reportDate },
      ],
    }),

    // POST /daily-closing
    closeDay: builder.mutation({
      query: (data) => ({
        url: "",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["DailyClosing"],
    }),
  }),
});

export const {
  useGetDailyClosingsQuery,
  useVerifyClosingChainQuery,
  useGetDailyClosingByDateQuery,
  useCloseDayMutation,
} = dailyClosingApi;
