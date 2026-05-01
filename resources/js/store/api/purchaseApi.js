import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const purchaseApi = createApi({
  reducerPath: 'purchaseApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v1' }),
  tagTypes: ['PurchaseOrder'],
  endpoints: (builder) => ({
    getPurchaseOrders: builder.query({
      query: ({ page = 1, perPage = 10, search = '', status = '', from_date = '', to_date = '' }) => 
        `/purchase-orders?page=${page}&per_page=${perPage}&search=${search}&status=${status}&from_date=${from_date}&to_date=${to_date}`,
      providesTags: ['PurchaseOrder'],
    }),

    addPurchaseOrder: builder.mutation({
      query: (data) => ({
        url: '/purchase-orders',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PurchaseOrder'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch({ type: 'grnApi/invalidateTags', payload: ['GRN'] });
          dispatch({ type: 'stockApi/invalidateTags', payload: ['Stock', 'Batch'] });
        } catch {}
      }
    }),

    updatePurchaseOrder: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/purchase-orders/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['PurchaseOrder'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch({ type: 'grnApi/invalidateTags', payload: ['GRN'] });
          dispatch({ type: 'stockApi/invalidateTags', payload: ['Stock', 'Batch'] });
        } catch {}
      }
    }),
    updatePurchaseOrderStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/purchase-orders/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => ['PurchaseOrder', { type: 'PurchaseOrder', id }],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch({ type: 'grnApi/invalidateTags', payload: ['GRN'] });
          dispatch({ type: 'stockApi/invalidateTags', payload: ['Stock', 'Batch'] });
        } catch {}
      }
    }),
    deletePurchaseOrder: builder.mutation({
      query: (id) => ({
        url: `/purchase-orders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PurchaseOrder'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch({ type: 'grnApi/invalidateTags', payload: ['GRN'] });
          dispatch({ type: 'stockApi/invalidateTags', payload: ['Stock', 'Batch'] });
        } catch {}
      }
    }),
  }),
});

export const {
  useGetPurchaseOrdersQuery,
  useAddPurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useUpdatePurchaseOrderStatusMutation,
  useDeletePurchaseOrderMutation,
} = purchaseApi;
