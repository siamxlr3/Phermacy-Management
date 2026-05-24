import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const stockApi = createApi({
  reducerPath: 'stockApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1',
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Stock', 'Batch'],
  endpoints: (builder) => ({
    getStockOverview: builder.query({
      query: ({ page = 1, perPage = 10, search = '' }) => 
        `/stocks/overview?page=${page}&per_page=${perPage}&search=${search}`,
      providesTags: ['Stock'],
    }),
    getBatchDetails: builder.query({
      query: ({ page = 1, perPage = 10, search = '', from_expiry = '', to_expiry = '' }) => {
        let params = new URLSearchParams({ page, per_page: perPage });
        if (search) params.append('search', search);
        if (from_expiry) params.append('from_expiry', from_expiry);
        if (to_expiry) params.append('to_expiry', to_expiry);
        return `/stocks/batches?${params.toString()}`;
      },
      providesTags: ['Batch'],
    }),
    getMedicineBatches: builder.query({
      query: (medicineId) => `/stocks/batches?medicine_id=${medicineId}&per_page=100`,
      providesTags: ['Batch'],
    }),
  }),
});

export const {
  useGetStockOverviewQuery,
  useGetBatchDetailsQuery,
  useLazyGetMedicineBatchesQuery,
} = stockApi;
