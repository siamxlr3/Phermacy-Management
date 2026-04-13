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
      query: ({ page = 1, perPage = 10, search = '', from_expiry = '', to_expiry = '' }) => 
        `/stocks/batches?page=${page}&per_page=${perPage}&search=${search}&from_expiry=${from_expiry}&to_expiry=${to_expiry}`,
      providesTags: ['Batch'],
    }),
  }),
});

export const {
  useGetStockOverviewQuery,
  useGetBatchDetailsQuery,
} = stockApi;
