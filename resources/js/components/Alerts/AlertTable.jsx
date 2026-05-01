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

const AlertTable = ({ type = '' }) => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [filterType, setFilterType] = useState(type);
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
    <div className="flex flex-col h-full bg-transparent overflow-hidden min-h-0">
      

      {/* Table Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-50/80 backdrop-blur-md z-10 border-b border-slate-200/60">
            <tr>
              <th className="px-6 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Flagged At</th>
              <th className="px-6 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Medicine & Batch</th>
              <th className="px-6 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Type</th>
              <th className="px-6 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Severity</th>
              <th className="px-6 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Message</th>
              <th className="px-6 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/60">
            {isLoadingState ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-5"><div className="h-3 bg-slate-100 rounded w-24"></div></td>
                  <td className="px-6 py-5"><div className="h-3 bg-slate-100 rounded w-40"></div></td>
                  <td className="px-6 py-5 text-center"><div className="h-5 bg-slate-100 rounded w-16 mx-auto"></div></td>
                  <td className="px-6 py-5 text-center"><div className="h-5 bg-slate-100 rounded-full w-20 mx-auto"></div></td>
                  <td className="px-6 py-5"><div className="h-3 bg-slate-100 rounded w-64"></div></td>
                  <td className="px-6 py-5 text-right"><div className="h-8 bg-slate-100 rounded w-16 ml-auto"></div></td>
                </tr>
              ))
            ) : alerts.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-24 text-center">
                   <div className="empty-state">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl flex items-center justify-center mb-4 border border-emerald-100 shadow-sm mx-auto">
                      <CheckCircle2 size={32} className="text-emerald-500" />
                    </div>
                    <p className="text-[15px] font-extrabold text-[#0f1923]">All Clear — No Alerts</p>
                    <p className="text-[12px] text-slate-400 font-bold mt-1">No low stock items found. Your inventory is healthy.</p>
                  </div>
                </td>
              </tr>
            ) : (
              alerts.map((alert) => (
                <tr
                  key={alert.id}
                  className={`group transition-all duration-200 hover:bg-white/60 ${
                    alert.severity === 'Critical' ? 'bg-rose-50/5' : ''
                  }`}
                >
                  <td className="px-6 py-5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                      {alert.created_at.split(' ')[0]}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-extrabold text-[#0f1923] tracking-tight">{alert.medicine_name}</span>
                      {alert.batch_number !== 'N/A' && (
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">
                          BATCH #{alert.batch_number}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest border ${typeColors[alert.type] || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                      {alert.type}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <AlertActionBadge severity={alert.severity} />
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-[12px] font-semibold text-slate-600 leading-relaxed max-w-sm">
                      {alert.message}
                    </p>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => handleDismiss(alert.id)}
                        disabled={isDismissing}
                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl text-[10px] font-extrabold uppercase tracking-widest text-slate-500 transition-all active:scale-95 shadow-sm"
                      >
                        <BellOff size={13} /> Dismiss
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
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-slate-200/60 bg-white/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
              Showing {alerts.length} of {meta.total} alerts
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-2 rounded-xl border border-slate-200 hover:bg-white text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all shadow-sm bg-white"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-[11px] font-extrabold text-[#0f1923] px-3 tracking-widest">
              {meta.current_page} <span className="text-slate-300 mx-1">/</span> {meta.last_page}
            </span>
            <button
              onClick={() => setPage(p => Math.min(p + 1, meta.last_page))}
              disabled={page >= meta.last_page}
              className="p-2 rounded-xl border border-slate-200 hover:bg-white text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all shadow-sm bg-white"
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
