import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const supplierApi = createApi({
  reducerPath: 'supplierApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v1' }),
  tagTypes: ['Supplier'],
  endpoints: (builder) => ({
    getSuppliers: builder.query({
      query: ({ page = 1, perPage = 10, search = '', status = '' }) => 
        `/suppliers?page=${page}&per_page=${perPage}&search=${search}&status=${status}`,
      providesTags: ['Supplier'],
    }),
    getActiveSuppliers: builder.query({
      query: () => '/suppliers/active',
      providesTags: ['Supplier'],
    }),
    addSupplier: builder.mutation({
      query: (data) => ({
        url: '/suppliers',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Supplier'],
    }),
    updateSupplier: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/suppliers/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Supplier'],
    }),
    deleteSupplier: builder.mutation({
      query: (id) => ({
        url: `/suppliers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Supplier'],
    }),
  }),
});

export const {
  useGetSuppliersQuery,
  useGetActiveSuppliersQuery,
  useAddSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} = supplierApi;
