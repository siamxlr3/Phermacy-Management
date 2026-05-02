import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const cashRegisterApi = createApi({
  reducerPath: 'cashRegisterApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1',
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/json');
      // Auth token if needed, usually handled by a wrapper or interceptor
      return headers;
    },
  }),
  tagTypes: ['CashRegister'],
  endpoints: (builder) => ({
    getRegisterStatus: builder.query({
      query: () => '/cash-registers/status',
      providesTags: ['CashRegister'],
    }),
    getRegisterHistory: builder.query({
      query: (params) => ({
        url: '/cash-registers',
        params: params
      }),
      providesTags: ['CashRegister'],
    }),
    openRegister: builder.mutation({
      query: (data) => ({
        url: '/cash-registers/open',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['CashRegister'],
    }),
    closeRegister: builder.mutation({
      query: (data) => ({
        url: '/cash-registers/close',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['CashRegister'],
    }),
  }),
});

export const {
  useGetRegisterStatusQuery,
  useGetRegisterHistoryQuery,
  useOpenRegisterMutation,
  useCloseRegisterMutation,
} = cashRegisterApi;
