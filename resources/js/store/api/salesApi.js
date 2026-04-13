import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const salesApi = createApi({
  reducerPath: 'salesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1',
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Sale', 'Stock', 'Medicine', 'Batch'],
  endpoints: (builder) => ({
    getSales: builder.query({
      query: ({ page = 1, perPage = 10, search = '', status = '' }) => 
        `/sales?page=${page}&per_page=${perPage}&search=${search}&status=${status}`,
      providesTags: ['Sale'],
    }),
    processSale: builder.mutation({
      query: (data) => ({
        url: '/sales',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Sale', 'Stock', 'Medicine', 'Batch'],
    }),
    getSaleDetails: builder.query({
      query: (id) => `/sales/${id}`,
      providesTags: (result, error, id) => [{ type: 'Sale', id }],
    }),
  }),
});

export const {
  useGetSalesQuery,
  useProcessSaleMutation,
  useGetSaleDetailsQuery,
} = salesApi;
