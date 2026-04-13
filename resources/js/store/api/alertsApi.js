import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const alertsApi = createApi({
  reducerPath: 'alertsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1',
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Alert'],
  endpoints: (builder) => ({
    getAlerts: builder.query({
      query: ({ page = 1, perPage = 10, type = '', severity = '', search = '', fromDate = '', toDate = '' }) => {
        const params = new URLSearchParams({
          page,
          per_page: perPage,
          ...(type     && { type }),
          ...(severity && { severity }),
          ...(search   && { search }),
          ...(fromDate && { from_date: fromDate }),
          ...(toDate   && { to_date: toDate }),
        });
        return `/alerts?${params.toString()}`;
      },
      providesTags: ['Alert'],
    }),
    getAlertSummary: builder.query({
      query: () => '/alerts/summary',
      providesTags: ['Alert'],
    }),
    dismissAlert: builder.mutation({
      query: (id) => ({
        url: `/alerts/${id}/dismiss`,
        method: 'POST',
      }),
      invalidatesTags: ['Alert'],
    }),
    runProcess: builder.mutation({
      query: () => ({
        url: '/alerts/process',
        method: 'POST',
      }),
      invalidatesTags: ['Alert'],
    }),
  }),
});

export const {
  useGetAlertsQuery,
  useGetAlertSummaryQuery,
  useDismissAlertMutation,
  useRunProcessMutation,
} = alertsApi;
