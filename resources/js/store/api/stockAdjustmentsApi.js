import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const stockAdjustmentsApi = createApi({
    reducerPath: 'stockAdjustmentsApi',
    baseQuery: fetchBaseQuery({
        baseUrl: '/api/v1',
        prepareHeaders: (headers) => {
            headers.set('Accept', 'application/json');
            return headers;
        },
    }),
    tagTypes: ['StockAdjustment', 'Medicine', 'Stock'],
    endpoints: (builder) => ({
        getStockAdjustments: builder.query({
            query: (params) => ({
                url: '/stock-adjustments',
                params: {
                    page: params?.page || 1,
                    per_page: params?.per_page || 10,
                    search: params?.search || '',
                    adjustment_type: params?.adjustment_type || '',
                    from_date: params?.from_date || '',
                    to_date: params?.to_date || '',
                },
            }),
            providesTags: (result) =>
                result
                    ? [
                          ...result.data.map(({ id }) => ({ type: 'StockAdjustment', id })),
                          { type: 'StockAdjustment', id: 'LIST' },
                      ]
                    : [{ type: 'StockAdjustment', id: 'LIST' }],
        }),
        createStockAdjustment: builder.mutation({
            query: (body) => ({
                url: '/stock-adjustments',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['StockAdjustment', 'Medicine', 'Stock', 'Batch'],
        }),
        deleteStockAdjustment: builder.mutation({
            query: (id) => ({
                url: `/stock-adjustments/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['StockAdjustment'],
        }),
    }),
});

export const {
    useGetStockAdjustmentsQuery,
    useCreateStockAdjustmentMutation,
    useDeleteStockAdjustmentMutation,
} = stockAdjustmentsApi;
