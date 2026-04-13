import React, { useState, useEffect } from 'react';
import { useGetAdjustmentsQuery, useDeleteAdjustmentMutation } from '../../store/api/adjustmentApi';
import { Search, RotateCcw, Calendar, History, ChevronLeft, ChevronRight, User, Hash, Trash2, Edit2 } from 'lucide-react';
import { format, subDays } from 'date-fns';
import DateRangeFilter from '../Shared/DateRangeFilter';
import toast from 'react-hot-toast';

const ReturnTable = ({ onAdd, onEdit }) => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, isLoading, isFetching } = useGetAdjustmentsQuery({ 
    page, 
    perPage, 
    search: debouncedSearch,
    from_date: fromDate,
    to_date: toDate
  });

  const [deleteAdjustment, { isLoading: isDeleting }] = useDeleteAdjustmentMutation();

  const adjustments = data?.data || [];
  const meta = data?.meta || {};
  const isLoadingState = isLoading || isFetching;

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this adjustment? This will reverse the stock deduction.')) return;
    try {
      await deleteAdjustment(id).unwrap();
      toast.success('Adjustment deleted and stock reversed');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete adjustment');
    }
  };

  const getStatusColor = (type) => {
    switch(type) {
      case 'Return': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'Damage': return 'bg-red-50 text-red-700 border-red-100';
      case 'Correction': return 'bg-blue-50 text-blue-700 border-blue-100';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Filters */}
      <div className="shrink-0 p-6 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <DateRangeFilter 
            fromDate={fromDate} 
            toDate={toDate} 
            hideLabel={true}
            hidePresets={true}
            onChange={(from, to) => { setFromDate(from); setToDate(to); setPage(1); }}
            onReset={() => { setFromDate(format(subDays(new Date(), 30), 'yyyy-MM-dd')); setToDate(format(new Date(), 'yyyy-MM-dd')); setPage(1); }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none w-64 placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-lg shadow-lg transition-all"
          >
            <RotateCcw size={16} /> Record Return
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Date & Admin</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Medicine details</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Batch Info</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Qty</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Type</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Reason</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoadingState ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-40"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-12 mx-auto"></div></td>
                  <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-full w-20 mx-auto"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                  <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-lg w-16 ml-auto"></div></td>
                </tr>
              ))
            ) : adjustments.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-20 text-center text-slate-400 font-bold">No adjustment records found</td>
              </tr>
            ) : (
              adjustments.map((item) => (
                <tr key={item.id} className="group hover:bg-slate-50/50 transition-all duration-150 relative">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700">{item.adjustment_date}</span>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                        <User size={10} />
                        {item.user_name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-700">{item.medicine_name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded w-fit capitalize">
                      <Hash size={10} />
                      {item.batch_number}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-black text-red-600">{item.qty_tablets_changed}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(item.type)}`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <span className="text-sm text-slate-600 line-clamp-1 italic">"{item.reason}"</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onEdit(item)}
                        className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Adjustment"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, item.id)}
                        disabled={isDeleting}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete & Restore Stock"
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

      <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30">
        <span className="text-xs text-slate-400 font-medium">Page {meta.current_page || 1}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-400 disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setPage(p => Math.min(p + 1, meta.last_page || 1))}
            disabled={page >= (meta.last_page || 1)}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-400 disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReturnTable;
