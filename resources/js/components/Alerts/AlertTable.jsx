import React, { useState, useEffect } from 'react';
import { useGetAlertsQuery, useDismissAlertMutation } from '../../store/api/alertsApi';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight,
  BellOff, Clock, Package, Calendar, X, Filter, Trash2, Edit2, Info
} from 'lucide-react';
import AlertActionBadge from './AlertActionBadge';
import toast from 'react-hot-toast';
import { format, subDays } from 'date-fns';
import DateRangeFilter from '../Shared/DateRangeFilter';

const AlertTable = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [filterType, setFilterType] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data: alertsData, isLoading, isFetching } = useGetAlertsQuery({
    page,
    perPage,
    type: filterType,
    severity: filterSeverity,
    search: debouncedSearch,
    from_date: fromDate,
    to_date: toDate,
  });

  const [dismissAlert, { isLoading: isDismissing }] = useDismissAlertMutation();

  const alerts = alertsData?.data || [];
  const meta = alertsData?.meta || {};
  const isLoadingState = isLoading || isFetching;

  const handleDismiss = async (id) => {
    try {
      await dismissAlert(id).unwrap();
      toast.success('Alert dismissed');
    } catch {
      toast.error('Failed to dismiss alert');
    }
  };

  const typeColors = {
    'Low Stock': 'bg-indigo-50 text-indigo-600 border-indigo-100',
    'Expiry': 'bg-orange-50 text-orange-600 border-orange-100',
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-0">
      
      {/* Filters Header */}
      <div className="shrink-0 p-6 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-slate-50/30">
        <div className="flex flex-wrap items-center gap-4">
          <DateRangeFilter 
            fromDate={fromDate} 
            toDate={toDate} 
            hideLabel={true}
            hidePresets={true}
            onChange={(from, to) => { setFromDate(from); setToDate(to); setPage(1); }}
            onReset={() => { setFromDate(''); setToDate(''); setPage(1); }}
          />
          
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            {[['', 'All'], ['Low Stock', 'Low Stock'], ['Expiry', 'Expiry']].map(([val, lbl]) => (
              <button
                key={val}
                onClick={() => { setFilterType(val); setPage(1); }}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  filterType === val
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>

          <select
            value={filterSeverity}
            onChange={(e) => { setFilterSeverity(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none min-w-[140px] font-medium text-slate-600 shadow-sm"
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="Warning">Warning</option>
            <option value="Info">Info</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search medicine..."
              className="pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none w-full sm:w-64 placeholder:text-slate-400 font-medium shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse cursor-default">
          <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Flagged At</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Medicine & Batch</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Type</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Severity</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Message</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoadingState ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-40"></div></td>
                  <td className="px-6 py-4 text-center"><div className="h-6 bg-slate-100 rounded w-16 mx-auto"></div></td>
                  <td className="px-6 py-4 text-center"><div className="h-6 bg-slate-100 rounded-full w-20 mx-auto"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-64"></div></td>
                  <td className="px-6 py-4 text-right"><div className="h-8 bg-slate-100 rounded w-16 ml-auto"></div></td>
                </tr>
              ))
            ) : alerts.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-20 text-center">
                   <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 border border-emerald-100">
                      <CheckCircle2 size={28} className="text-emerald-400" />
                    </div>
                    <p className="text-sm font-black text-slate-800 uppercase tracking-widest">All Clear</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Your inventory is within safe parameters</p>
                  </div>
                </td>
              </tr>
            ) : (
              alerts.map((alert) => (
                <tr
                  key={alert.id}
                  className={`group transition-all duration-150 hover:bg-slate-50/50 ${
                    alert.severity === 'Critical' ? 'bg-rose-50/10' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-tighter">
                      {alert.created_at.split(' ')[0]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-800">{alert.medicine_name}</span>
                      {alert.batch_number !== 'N/A' && (
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-0.5">
                          BATCH #{alert.batch_number}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${typeColors[alert.type] || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                      {alert.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <AlertActionBadge severity={alert.severity} />
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-semibold text-slate-600 leading-relaxed max-w-sm">
                      {alert.message}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => handleDismiss(alert.id)}
                        disabled={isDismissing}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all active:scale-95 shadow-sm"
                      >
                        <BellOff size={12} /> Dismiss
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
      {!isLoadingState && meta.last_page > 1 && (
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Showing {alerts.length} of {meta.total} alerts
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-slate-200 hover:bg-white text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm bg-white"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-[11px] font-black text-slate-600 px-3 uppercase tracking-widest">
              Page {meta.current_page} <span className="text-slate-300 mx-1 border-r border-slate-200 h-4 inline-block align-middle" /> {meta.last_page}
            </span>
            <button
              onClick={() => setPage(p => Math.min(p + 1, meta.last_page))}
              disabled={page >= meta.last_page}
              className="p-2 rounded-lg border border-slate-200 hover:bg-white text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm bg-white"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertTable;
