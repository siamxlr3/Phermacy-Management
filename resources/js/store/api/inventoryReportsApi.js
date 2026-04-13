import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const inventoryReportsApi = createApi({
  reducerPath: 'inventoryReportsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1',
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['InventoryReport'],
  endpoints: (builder) => ({
    getInventoryReport: builder.query({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters?.from_date) params.append('from_date', filters.from_date);
        if (filters?.to_date) params.append('to_date', filters.to_date);
        return `/reports/inventory?${params.toString()}`;
      },
      providesTags: ['InventoryReport'],
    }),
    refreshInventoryReports: builder.mutation({
      query: () => ({
        url: '/reports/inventory/refresh',
        method: 'POST',
      }),
      invalidatesTags: ['InventoryReport'],
    }),
  }),
});

export const {
  useGetInventoryReportQuery,
  useRefreshInventoryReportsMutation,
} = inventoryReportsApi;
