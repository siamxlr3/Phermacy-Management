import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const adjustmentApi = createApi({
  reducerPath: 'adjustmentApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1',
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Adjustment', 'Stock', 'Batch', 'Medicine'],
  endpoints: (builder) => ({
    getAdjustments: builder.query({
      query: ({ page = 1, perPage = 10, search = '', status = '', from_date = '', to_date = '' }) => 
        `/adjustments?page=${page}&per_page=${perPage}&search=${search}&status=${status}&from_date=${from_date}&to_date=${to_date}`,
      providesTags: ['Adjustment'],
    }),
    addAdjustment: builder.mutation({
      query: (data) => ({
        url: '/adjustments',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Adjustment', 'Stock', 'Batch', 'Medicine'],
    }),
    updateAdjustment: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/adjustments/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Adjustment', 'Stock', 'Batch', 'Medicine'],
    }),
    deleteAdjustment: builder.mutation({
      query: (id) => ({
        url: `/adjustments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Adjustment', 'Stock', 'Batch', 'Medicine'],
    }),
    getBatchesByMedicine: builder.query({
      query: (medicineId) => `/medicines/${medicineId}/batches`,
      providesTags: (result, error, id) => [{ type: 'Batch', id }],
    }),
  }),
});

export const {
  useGetAdjustmentsQuery,
  useAddAdjustmentMutation,
  useUpdateAdjustmentMutation,
  useDeleteAdjustmentMutation,
  useGetBatchesByMedicineQuery,
} = adjustmentApi;
