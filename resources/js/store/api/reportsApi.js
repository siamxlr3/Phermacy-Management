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
      query: (params) => ({
        url: '/reports/dashboard',
        params,
      }),
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
