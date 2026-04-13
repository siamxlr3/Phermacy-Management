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
  tagTypes: ['Medicine', 'Category', 'Manufacturer'],
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

    // Categories
    getCategories: builder.query({
      query: ({ page = 1, perPage = 10, search = '' }) => 
        `/categories?page=${page}&per_page=${perPage}&search=${search}`,
      providesTags: ['Category'],
    }),
    getActiveCategories: builder.query({
      query: () => '/categories/active',
      providesTags: ['Category'],
    }),
    addCategory: builder.mutation({
      query: (data) => ({
        url: '/categories',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Category'],
    }),
    updateCategory: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/categories/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Category'],
    }),
    deleteCategory: builder.mutation({
      query: (id) => ({
        url: `/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Category'],
    }),

    // Manufacturers
    getManufacturers: builder.query({
      query: ({ page = 1, perPage = 10, search = '' }) => 
        `/manufacturers?page=${page}&per_page=${perPage}&search=${search}`,
      providesTags: ['Manufacturer'],
    }),
    getActiveManufacturers: builder.query({
      query: () => '/manufacturers/active',
      providesTags: ['Manufacturer'],
    }),
    addManufacturer: builder.mutation({
      query: (data) => ({
        url: '/manufacturers',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Manufacturer'],
    }),
    updateManufacturer: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/manufacturers/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Manufacturer'],
    }),
    deleteManufacturer: builder.mutation({
      query: (id) => ({
        url: `/manufacturers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Manufacturer'],
    }),
  }),
});

export const {
  useGetMedicinesQuery,
  useGetActiveMedicinesQuery,
  useAddMedicineMutation,
  useUpdateMedicineMutation,
  useDeleteMedicineMutation,
  useGetCategoriesQuery,
  useGetActiveCategoriesQuery,
  useAddCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetManufacturersQuery,
  useGetActiveManufacturersQuery,
  useAddManufacturerMutation,
  useUpdateManufacturerMutation,
  useDeleteManufacturerMutation,
} = medicineApi;
