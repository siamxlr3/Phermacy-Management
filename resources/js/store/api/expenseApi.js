import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const expenseApi = createApi({
  reducerPath: 'expenseApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1',
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Expense'],
  endpoints: (builder) => ({
    getExpenses: builder.query({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page);
        if (params?.per_page) queryParams.append('per_page', params.per_page);
        if (params?.search) queryParams.append('search', params.search);
        if (params?.status) queryParams.append('status', params.status);
        if (params?.from_date) queryParams.append('from_date', params.from_date);
        if (params?.to_date) queryParams.append('to_date', params.to_date);
        
        return `/expenses?${queryParams.toString()}`;
      },
      providesTags: ['Expense'],
    }),
    getExpenseSummary: builder.query({
      query: () => '/expenses/summary',
      providesTags: ['Expense'],
    }),
    getExpense: builder.query({
      query: (id) => `/expenses/${id}`,
      providesTags: (result, error, id) => [{ type: 'Expense', id }],
    }),
    addExpense: builder.mutation({
      query: (data) => ({
        url: '/expenses',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Expense'],
    }),
    updateExpense: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/expenses/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Expense'],
    }),
    deleteExpense: builder.mutation({
      query: (id) => ({
        url: `/expenses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Expense'],
    }),
  }),
});

export const {
  useGetExpensesQuery,
  useGetExpenseSummaryQuery,
  useGetExpenseQuery,
  useAddExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
} = expenseApi;
