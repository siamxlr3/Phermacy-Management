import React, { useState, useEffect } from 'react';
import { useGetBatchDetailsQuery } from '../../store/api/stockApi';
import { Search, Package, Calendar, Clock, ChevronLeft, ChevronRight, Hash, FlaskConical } from 'lucide-react';
import { format, isBefore, addDays } from 'date-fns';

const StatusBadge = ({ expiryDate }) => {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const soon = addDays(now, 90); // 3 months

  if (isBefore(expiry, now)) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-100">
        Expired
      </span>
    );
  }
  
  if (isBefore(expiry, soon)) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
        Expiring Soon
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
      Healthy
    </span>
  );
};

const BatchListTable = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, isLoading, isFetching } = useGetBatchDetailsQuery({ 
    page, 
    perPage, 
    search: debouncedSearch 
  });

  const batches = data?.data || [];
  const meta = data?.meta || {};
  const isLoadingState = isLoading || isFetching;

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="shrink-0 p-6 border-b border-slate-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
            <FlaskConical size={16} className="text-purple-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Batch Inventory</h2>
            <p className="text-[11px] text-slate-400 font-medium">Tracking expiry and individual batch levels</p>
          </div>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search medicine or batch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none w-64 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Medicine ID & Name</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Supplier ID & Name</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Batch Number</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Expiry Date</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Qty Tablets</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Remaining</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Cost/Tablet</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap border-r-0">Received Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoadingState ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-40"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                  <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-100 rounded w-20 mx-auto"></div></td>
                  <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-100 rounded w-24 mx-auto"></div></td>
                  <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-100 rounded w-16 mx-auto"></div></td>
                  <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-100 rounded w-16 mx-auto"></div></td>
                  <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-100 rounded w-16 mx-auto"></div></td>
                  <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-100 rounded w-24 mx-auto"></div></td>
                </tr>
              ))
            ) : batches.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-20 text-center text-slate-400 font-bold">No batches recorded</td>
              </tr>
            ) : (
              batches.map((batch) => (
                <tr key={batch.id} className="hover:bg-slate-50/50 transition-all duration-150">
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-700">{batch.medicine_name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-500">{batch.supplier_name}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">{batch.batch_number}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-medium text-slate-600">{batch.expiry_date}</span>
                      <StatusBadge expiryDate={batch.expiry_date} />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-bold text-slate-500">{batch.qty_tablets}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-bold text-slate-900">{batch.qty_tablets_remaining}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-bold text-emerald-600">৳{batch.cost_per_tablet}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-medium text-slate-500">{batch.received_date}</span>
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

export default BatchListTable;
