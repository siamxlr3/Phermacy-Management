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
    }),

    updatePurchaseOrder: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/purchase-orders/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['PurchaseOrder'],
    }),
    updatePurchaseOrderStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/purchase-orders/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => ['PurchaseOrder', { type: 'PurchaseOrder', id }],
    }),
    deletePurchaseOrder: builder.mutation({
      query: (id) => ({
        url: `/purchase-orders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PurchaseOrder'],
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
