import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const reportsApi = createApi({
  reducerPath: 'reportsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1',
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Report'],
  endpoints: (builder) => ({
    getReportDashboard: builder.query({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters?.from_date) params.append('from_date', filters.from_date);
        if (filters?.to_date) params.append('to_date', filters.to_date);
        return `/reports/dashboard?${params.toString()}`;
      },
      providesTags: ['Report'],
    }),
    refreshReports: builder.mutation({
      query: () => ({
        url: '/reports/refresh',
        method: 'POST',
      }),
      invalidatesTags: ['Report'],
    }),
  }),
});

export const {
  useGetReportDashboardQuery,
  useRefreshReportsMutation,
} = reportsApi;
