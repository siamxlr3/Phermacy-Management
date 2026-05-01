import React, { useState, useEffect } from 'react';
import { useGetBatchDetailsQuery } from '../../store/api/stockApi';
import { Search, Package, Calendar, Clock, ChevronLeft, ChevronRight, Hash, FlaskConical, Boxes, Droplets, Plus } from 'lucide-react';
import { format, isBefore, addDays } from 'date-fns';

const GROUP_A = ['Tablet', 'Capsule', 'Suppository', 'Patch'];

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

const BatchListTable = ({ onAdd }) => {
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
      <div className="shrink-0 p-6 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
            <FlaskConical size={20} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-800 tracking-tight">Batch Inventory</h2>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Tracking expiry and unit-level stocks</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search medicine or batch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none w-72 placeholder:text-slate-400 transition-all"
            />
          </div>
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus size={16} /> New Receipt
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-white z-10 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Medicine & Batch</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Supplier</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Dosage</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Expiry Status</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Qty (Units)</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Cost Structure</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Received</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoadingState ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-5"><div className="h-4 bg-slate-100 rounded w-40"></div></td>
                  <td className="px-6 py-5"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                  <td className="px-6 py-5"><div className="h-4 bg-slate-100 rounded w-20 mx-auto"></div></td>
                  <td className="px-6 py-5 text-center"><div className="h-4 bg-slate-100 rounded w-24 mx-auto"></div></td>
                  <td className="px-6 py-5 text-right"><div className="h-4 bg-slate-100 rounded w-16 ml-auto"></div></td>
                  <td className="px-6 py-5 text-right"><div className="h-4 bg-slate-100 rounded w-20 ml-auto"></div></td>
                  <td className="px-6 py-5 text-center"><div className="h-4 bg-slate-100 rounded w-24 mx-auto"></div></td>
                </tr>
              ))
            ) : batches.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-24 text-center">
                   <Package size={40} className="text-slate-100 mx-auto mb-4" />
                   <p className="text-sm font-bold text-slate-300 uppercase tracking-[0.2em]">No batch records found</p>
                </td>
              </tr>
            ) : (
              batches.map((batch) => {
                const isGroupA = GROUP_A.includes(batch.medicine_dosage_form);
                return (
                  <tr key={batch.id} className="group hover:bg-slate-50/50 transition-all duration-150">
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-black text-slate-700">{batch.medicine_name}</span>
                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">Batch: {batch.batch_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-slate-500">{batch.supplier_name}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center">
                        <div className={`p-1.5 rounded-lg ${isGroupA ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                           {isGroupA ? <Boxes size={14} /> : <Droplets size={14} />}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">{batch.medicine_dosage_form}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-600">{batch.expiry_date}</span>
                        <StatusBadge expiryDate={batch.expiry_date} />
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-black text-slate-900">{batch.qty_tablets_remaining}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">of {batch.qty_tablets} total</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex flex-col items-end gap-0.5">
                        {isGroupA ? (
                          <>
                            <span className="text-xs font-black text-emerald-600">৳{batch.cost_per_tablet}/Tab</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">৳{batch.cost_per_stripe}/Stripe • ৳{batch.cost_per_box}/Box</span>
                            {batch.strength && (
                              <span className="text-[8px] font-bold text-indigo-400 mt-0.5">{batch.strength}</span>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="text-xs font-black text-emerald-600">৳{batch.price} / Unit</span>
                            {batch.volume && (
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{batch.volume}</span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-xs font-bold text-slate-500">{batch.received_date}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page {meta.current_page || 1} of {meta.last_page || 1}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm active:scale-95"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setPage(p => Math.min(p + 1, meta.last_page || 1))}
            disabled={page >= (meta.last_page || 1)}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm active:scale-95"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchListTable;
