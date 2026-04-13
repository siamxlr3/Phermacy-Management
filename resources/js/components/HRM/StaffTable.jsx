import React, { useState, useEffect } from 'react';
import { useGetStaffQuery, useDeleteStaffMutation } from '../../store/api/hrmApi';
import { Search, Plus, User, Phone, Mail, Calendar, MapPin, ChevronLeft, ChevronRight, Trash2, Edit2, BadgeInfo } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { motion } from 'framer-motion';
import DateRangeFilter from '../Shared/DateRangeFilter';
import toast from 'react-hot-toast';

const StaffTable = ({ onAdd, onEdit }) => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => { 
      setDebouncedSearch(searchTerm); 
      setPage(1); 
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, isLoading, isFetching } = useGetStaffQuery({ 
    page, 
    per_page: perPage, 
    search: debouncedSearch,
    status: status,
    from_date: fromDate,
    to_date: toDate
  });

  const [deleteStaff, { isLoading: isDeleting }] = useDeleteStaffMutation();

  const handleDelete = async (staff) => {
    if (!confirm(`Are you sure you want to remove ${staff.full_name}? This will delete their records.`)) return;
    try {
      await deleteStaff(staff.id).unwrap();
      toast.success('Staff records removed successfully');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete staff record');
    }
  };

  const staffList = data?.data || [];
  const meta = data?.meta || {};
  const isLoadingState = isLoading || isFetching;

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'resigned': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'terminated': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header & Filters */}
      <div className="shrink-0 p-6 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-slate-50/30">
        <div className="flex flex-wrap items-center gap-4">
          <DateRangeFilter 
            fromDate={fromDate} 
            toDate={toDate} 
            hideLabel={true}
            hidePresets={true}
            onChange={(from, to) => { setFromDate(from); setToDate(to); setPage(1); }}
            onReset={() => { setFromDate(''); setToDate(''); }}
          />
          
          <select 
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none min-w-[140px] font-medium text-slate-600 appearance-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="resigned">Resigned</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:flex-initial">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Name, Phone, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none w-full sm:w-64 placeholder:text-slate-400 font-medium"
            />
          </div>
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-200 transition-all whitespace-nowrap active:scale-95"
          >
            <Plus size={18} /> Add Staff
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-x-auto min-h-0 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Full Name & ID</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Contact Info</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Designation & Role</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Shift</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Basic Salary</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Join Date</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoadingState ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-10 bg-slate-100 rounded-lg w-40"></div></td>
                  <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-100 rounded w-48 mx-auto"></div></td>
                  <td className="px-6 py-4 text-center"><div className="h-8 bg-slate-100 rounded w-32 mx-auto"></div></td>
                  <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-100 rounded w-20 mx-auto"></div></td>
                  <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-100 rounded w-24 mx-auto"></div></td>
                  <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-100 rounded w-20 mx-auto"></div></td>
                  <td className="px-6 py-4 text-center"><div className="h-6 bg-slate-100 rounded-full w-20 mx-auto"></div></td>
                  <td className="px-6 py-4 text-right"><div className="h-8 bg-slate-100 rounded-lg w-16 ml-auto"></div></td>
                </tr>
              ))
            ) : staffList.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100 text-slate-300">
                      <User size={24} />
                    </div>
                    <p className="text-sm font-bold text-slate-800">No staff members found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusted filters or add new personnel.</p>
                  </div>
                </td>
              </tr>
            ) : (
              staffList.map((staff) => (
                <tr key={staff.id} className="group transition-all duration-150 hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 shrink-0 uppercase font-bold text-xs border border-slate-200">
                        {staff.full_name?.charAt(0) || '?'}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-slate-700 truncate">{staff.full_name}</span>
                        <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mt-0.5">{staff.employee_id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 items-center">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                        <Phone size={11} className="text-slate-400" />
                        <span>{staff.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <Mail size={11} className="text-slate-400" />
                        <span>{staff.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700">{staff.designation}</span>
                      <span className="text-[10px] font-medium text-slate-400 uppercase mt-0.5">{staff.role_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                      {staff.shift_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-bold text-slate-900 tracking-tight">৳{parseFloat(staff.basic_salary).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                      <Calendar size={12} className="text-slate-400" />
                      <span>{staff.join_date}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(staff.status)}`}>
                      {staff.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => onEdit(staff)}
                        className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Details"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(staff)}
                        disabled={isDeleting}
                        className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30"
                        title="Remove Record"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}

          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="shrink-0 flex items-center justify-between px-6 py-4 bg-slate-50/30 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Rows per page:</span>
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
            className="bg-white border border-slate-200 text-xs font-black text-slate-600 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500/10 cursor-pointer shadow-sm"
          >
            {[10, 25, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-slate-500 px-3 py-1.5 bg-white rounded-xl border border-slate-200 shadow-sm">
            PAGE <span className="text-blue-600 font-black">{meta.current_page || 1}</span> OF <span className="text-blue-600 font-black">{meta.last_page || 1}</span>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="p-2 ml-2 rounded-xl border border-slate-200 hover:bg-white text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= (meta.last_page || 1)}
              className="p-2 rounded-xl border border-slate-200 hover:bg-white text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffTable;
