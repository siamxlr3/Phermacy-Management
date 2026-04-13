import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const settingApi = createApi({
  reducerPath: 'settingApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: '/api/v1',
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Tax', 'Address'],
  endpoints: (builder) => ({
    // Taxes
    getTaxes: builder.query({
      query: ({ page = 1, perPage = 10, search = '' }) => `/taxes?page=${page}&per_page=${perPage}&search=${search}`,
      providesTags: ['Tax'],
    }),
    addTax: builder.mutation({
      query: (body) => ({
        url: '/taxes',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Tax'],
    }),
    updateTax: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/taxes/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Tax'],
    }),
    deleteTax: builder.mutation({
      query: (id) => ({
        url: `/taxes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Tax'],
    }),

    // Addresses
    getAddresses: builder.query({
      query: ({ page = 1, perPage = 10, search = '' }) => `/addresses?page=${page}&per_page=${perPage}&search=${search}`,
      providesTags: ['Address'],
    }),
    addAddress: builder.mutation({
      query: (body) => ({
        url: '/addresses',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Address'],
    }),
    updateAddress: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/addresses/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Address'],
    }),
    deleteAddress: builder.mutation({
      query: (id) => ({
        url: `/addresses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Address'],
    }),
  }),
});

export const {
  useGetTaxesQuery,
  useAddTaxMutation,
  useUpdateTaxMutation,
  useDeleteTaxMutation,
  useGetAddressesQuery,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
} = settingApi;
