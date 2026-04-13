import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const returnsApi = createApi({
  reducerPath: 'returnsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1',
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Return', 'Sale', 'Stock'],
  endpoints: (builder) => ({
    getReturns: builder.query({
      query: ({ page = 1, perPage = 10, search = '', fromDate = '', toDate = '' }) => 
        `/returns?page=${page}&per_page=${perPage}&search=${search}&from_date=${fromDate}&to_date=${toDate}`,
      providesTags: ['Return'],
    }),
    lookupSale: builder.query({
      query: (invoiceNumber) => `/returns/lookup/${invoiceNumber}`,
      providesTags: (result, error, invoiceNumber) => [{ type: 'Sale', id: invoiceNumber }],
    }),
    processReturn: builder.mutation({
      query: (data) => ({
        url: '/returns',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Return', 'Sale', 'Stock', 'Medicine', 'Batch'],
    }),
  }),
});

export const {
  useGetReturnsQuery,
  useLookupSaleQuery,
  useProcessReturnMutation,
} = returnsApi;
