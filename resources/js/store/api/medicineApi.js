import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const medicineApi = createApi({
  reducerPath: 'medicineApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1',
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Medicine'],
  endpoints: (builder) => ({
    // Medicines
    getMedicines: builder.query({
      query: ({ page = 1, perPage = 10, search = '' }) => 
        `/medicines?page=${page}&per_page=${perPage}&search=${search}`,
      providesTags: ['Medicine'],
    }),
    getActiveMedicines: builder.query({
      query: () => '/medicines/active',
      providesTags: ['Medicine'],
    }),
    addMedicine: builder.mutation({
      query: (data) => ({
        url: '/medicines',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Medicine'],
    }),
    updateMedicine: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/medicines/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Medicine'],
    }),
    deleteMedicine: builder.mutation({
      query: (id) => ({
        url: `/medicines/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Medicine'],
    }),
  }),
});

export const {
  useGetMedicinesQuery,
  useGetActiveMedicinesQuery,
  useAddMedicineMutation,
  useUpdateMedicineMutation,
  useDeleteMedicineMutation,
} = medicineApi;
