import { baseApi } from "./base.api";
export const searchApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    searchReports: builder.query({
      query: ({ q = "", type, status, page = 1, limit = 20 } = {}) => {
        const params = new URLSearchParams();

        if (q) params.append("q", q);
        if (type) params.append("type", type);
        if (status) params.append("status", status);
        params.append("page", page);
        params.append("limit", limit);

        return {
          url: `/search?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["Search"],
    }),
  }),
});

export const { useSearchReportsQuery, useLazySearchReportsQuery } = searchApi;
