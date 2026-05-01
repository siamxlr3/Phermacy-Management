import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const grnApi = createApi({
  reducerPath: 'grnApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1',
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['GRN', 'PurchaseOrder', 'Stock'],
  endpoints: (builder) => ({
    getGRNs: builder.query({
      query: ({ page = 1, perPage = 10, search = '', from_date = '', to_date = '' }) => 
        `/grns?page=${page}&per_page=${perPage}&search=${search}&from_date=${from_date}&to_date=${to_date}`,
      providesTags: ['GRN'],
    }),
    getGRNDetails: builder.query({
      query: (id) => `/grns/${id}`,
      providesTags: (result, error, id) => [{ type: 'GRN', id }],
    }),
    addGRN: builder.mutation({
      query: (data) => ({
        url: '/grns',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['GRN', 'PurchaseOrder', 'Stock'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch({ type: 'stockApi/invalidateTags', payload: ['Stock', 'Batch'] });
          dispatch({ type: 'purchaseApi/invalidateTags', payload: ['PurchaseOrder'] });
        } catch {}
      }
    }),
    updateGRN: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/grns/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['GRN', 'Stock'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch({ type: 'stockApi/invalidateTags', payload: ['Stock', 'Batch'] });
          dispatch({ type: 'purchaseApi/invalidateTags', payload: ['PurchaseOrder'] });
        } catch {}
      }
    }),
    deleteGRN: builder.mutation({
      query: (id) => ({
        url: `/grns/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['GRN', 'PurchaseOrder', 'Stock'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch({ type: 'stockApi/invalidateTags', payload: ['Stock', 'Batch'] });
          dispatch({ type: 'purchaseApi/invalidateTags', payload: ['PurchaseOrder'] });
        } catch {}
      }
    }),
    getReceivedPurchaseOrders: builder.query({
      query: () => '/purchase-orders?status=Received&per_page=100&has_no_grn=1',
      providesTags: ['PurchaseOrder'],
    }),
    getPurchaseOrderDetails: builder.query({
      query: (id) => `/purchase-orders/${id}`,
      providesTags: (result, error, id) => [{ type: 'PurchaseOrder', id }],
    }),
  }),
});

export const {
  useGetGRNsQuery,
  useGetGRNDetailsQuery,
  useAddGRNMutation,
  useUpdateGRNMutation,
  useDeleteGRNMutation,
  useGetReceivedPurchaseOrdersQuery,
  useGetPurchaseOrderDetailsQuery,
} = grnApi;
