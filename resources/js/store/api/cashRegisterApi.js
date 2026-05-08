import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const cashRegisterApi = createApi({
  reducerPath: 'cashRegisterApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['CashRegister'],
  endpoints: (builder) => ({
    getTransactions: builder.query({
      query: (params) => ({
        url: '/cash-registers',
        params,
      }),
      providesTags: ['CashRegister'],
    }),
    getRegisterStatus: builder.query({
      query: () => '/cash-registers/status',
      providesTags: ['CashRegister'],
    }),
    recordTransaction: builder.mutation({
      query: (data) => ({
        url: '/cash-registers',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['CashRegister'],
    }),
  }),
});

export const {
  useGetTransactionsQuery,
  useGetRegisterStatusQuery,
  useRecordTransactionMutation,
} = cashRegisterApi;
