import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const hrmApi = createApi({
    reducerPath: 'hrmApi',
    baseQuery: fetchBaseQuery({ baseUrl: '/api/v1' }),
    tagTypes: ['Staff', 'Role', 'Shift', 'Attendance', 'LeaveType', 'Leave', 'Payroll'],
    endpoints: (builder) => ({
        // Staff Endpoints
        getStaff: builder.query({
            query: (params) => ({
                url: '/hrm/staff',
                params: params,
            }),
            providesTags: ['Staff'],
        }),
        getStaffMember: builder.query({
            query: (id) => `/hrm/staff/${id}`,
            providesTags: (result, error, id) => [{ type: 'Staff', id }],
        }),
        getActiveStaff: builder.query({
            query: () => '/hrm/staff/active',
            providesTags: ['Staff'],
        }),
        createStaff: builder.mutation({
            query: (data) => ({
                url: '/hrm/staff',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Staff', 'Attendance', 'Leave'],
        }),
        updateStaff: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/hrm/staff/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => ['Staff', { type: 'Staff', id }, 'Attendance', 'Leave'],
        }),
        deleteStaff: builder.mutation({
            query: (id) => ({
                url: `/hrm/staff/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Staff', 'Attendance', 'Leave'],
        }),

        // Role Endpoints
        getRoles: builder.query({
            query: (params) => ({
                url: '/hrm/roles',
                params: params,
            }),
            providesTags: ['Role'],
        }),
        getActiveRoles: builder.query({
            query: () => '/hrm/roles/active',
            providesTags: ['Role'],
        }),
        createRole: builder.mutation({
            query: (data) => ({
                url: '/hrm/roles',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Role', 'Staff'],
        }),
        updateRole: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/hrm/roles/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Role', 'Staff'],
        }),
        deleteRole: builder.mutation({
            query: (id) => ({
                url: `/hrm/roles/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Role', 'Staff'],
        }),

        // Shift Endpoints
        getShifts: builder.query({
            query: (params) => ({
                url: '/hrm/shifts',
                params: params,
            }),
            providesTags: ['Shift'],
        }),
        getActiveShifts: builder.query({
            query: () => '/hrm/shifts/active',
            providesTags: ['Shift'],
        }),
        createShift: builder.mutation({
            query: (data) => ({
                url: '/hrm/shifts',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Shift', 'Staff', 'Attendance'],
        }),
        updateShift: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/hrm/shifts/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Shift', 'Staff', 'Attendance'],
        }),
        deleteShift: builder.mutation({
            query: (id) => ({
                url: `/hrm/shifts/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Shift', 'Staff', 'Attendance'],
        }),

        // Attendance Endpoints
        getAttendance: builder.query({
            query: (params) => ({
                url: '/hrm/attendance',
                params: params,
            }),
            providesTags: ['Attendance'],
        }),
        createAttendance: builder.mutation({
            query: (data) => ({
                url: '/hrm/attendance',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Attendance'],
        }),
        updateAttendance: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/hrm/attendance/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => ['Attendance', { type: 'Attendance', id }],
        }),
        deleteAttendance: builder.mutation({
            query: (id) => ({
                url: `/hrm/attendance/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Attendance'],
        }),

        // LeaveType Endpoints
        getLeaveTypes: builder.query({
            query: (params) => ({
                url: '/hrm/leave-types',
                params: params,
            }),
            providesTags: ['LeaveType'],
        }),
        getActiveLeaveTypes: builder.query({
            query: () => '/hrm/leave-types/active',
            providesTags: ['LeaveType'],
        }),
        createLeaveType: builder.mutation({
            query: (data) => ({
                url: '/hrm/leave-types',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['LeaveType', 'Leave'],
        }),
        updateLeaveType: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/hrm/leave-types/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['LeaveType', 'Leave'],
        }),
        deleteLeaveType: builder.mutation({
            query: (id) => ({
                url: `/hrm/leave-types/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['LeaveType', 'Leave'],
        }),

        // Leave Endpoints
        getLeaves: builder.query({
            query: (params) => ({
                url: '/hrm/leaves',
                params: params,
            }),
            providesTags: ['Leave'],
        }),
        createLeave: builder.mutation({
            query: (data) => ({
                url: '/hrm/leaves',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Leave'],
        }),
        updateLeave: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/hrm/leaves/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => ['Leave', { type: 'Leave', id }],
        }),
        deleteLeave: builder.mutation({
            query: (id) => ({
                url: `/hrm/leaves/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Leave'],
        }),

        // Payroll Endpoints
        getPayrolls: builder.query({
            query: (params) => ({
                url: '/hrm/payrolls',
                params: params,
            }),
            providesTags: ['Payroll'],
        }),
        createPayroll: builder.mutation({
            query: (data) => ({
                url: '/hrm/payrolls',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Payroll'],
        }),
        updatePayroll: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/hrm/payrolls/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => ['Payroll', { type: 'Payroll', id }],
        }),
        deletePayroll: builder.mutation({
            query: (id) => ({
                url: `/hrm/payrolls/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Payroll'],
        }),
    }),
});

export const {
    useGetStaffQuery,
    useGetStaffMemberQuery,
    useGetActiveStaffQuery,
    useCreateStaffMutation,
    useUpdateStaffMutation,
    useDeleteStaffMutation,
    useGetRolesQuery,
    useGetActiveRolesQuery,
    useCreateRoleMutation,
    useUpdateRoleMutation,
    useDeleteRoleMutation,
    useGetShiftsQuery,
    useGetActiveShiftsQuery,
    useCreateShiftMutation,
    useUpdateShiftMutation,
    useDeleteShiftMutation,
    useGetAttendanceQuery,
    useCreateAttendanceMutation,
    useUpdateAttendanceMutation,
    useDeleteAttendanceMutation,
    useGetLeaveTypesQuery,
    useGetActiveLeaveTypesQuery,
    useCreateLeaveTypeMutation,
    useUpdateLeaveTypeMutation,
    useDeleteLeaveTypeMutation,
    useGetLeavesQuery,
    useCreateLeaveMutation,
    useUpdateLeaveMutation,
    useDeleteLeaveMutation,
    useGetPayrollsQuery,
    useCreatePayrollMutation,
    useUpdatePayrollMutation,
    useDeletePayrollMutation,
} = hrmApi;
