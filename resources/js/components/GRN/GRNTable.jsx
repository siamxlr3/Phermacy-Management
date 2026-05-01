import React, { useState, useEffect } from 'react';
import { useGetGRNsQuery, useDeleteGRNMutation } from '../../store/api/grnApi';
import { Search, Receipt, User, ChevronLeft, ChevronRight, Trash2, Edit2, CreditCard, Calendar } from 'lucide-react';
import { format, subDays } from 'date-fns';
import DateRangeFilter from '../Shared/DateRangeFilter';
import toast from 'react-hot-toast';

const GROUP_A = ['Tablet', 'Capsule', 'Suppository', 'Patch'];

const PaymentStatusBadge = ({ status }) => {
  const styles = {
    Paid: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    'Partially Paid': 'bg-blue-50 text-blue-700 border-blue-100',
    Due: 'bg-rose-50 text-rose-700 border-rose-100',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${styles[status] || styles.Due}`}>
      <CreditCard size={10} />
      {status}
    </span>
  );
};

const GRNTable = ({ onAdd, onEdit }) => {
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, isLoading, isFetching } = useGetGRNsQuery({
    page,
    perPage,
    search: debouncedSearch,
    from_date: fromDate,
    to_date: toDate,
  });

  const [deleteGRN, { isLoading: isDeleting }] = useDeleteGRNMutation();

  const handleDelete = async (e, grn) => {
    e.stopPropagation();
    if (!confirm(`Delete GRN for ${grn.supplier?.name || 'this order'}? This will reverse all stock changes.`)) return;
    try {
      await deleteGRN(grn.id).unwrap();
      toast.success('GRN deleted and stock reversed');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete GRN');
    }
  };

  const grns = data?.data || [];
  const meta = data?.meta || {};
  const isLoadingState = isLoading || isFetching;

  return (
    <div className="flex flex-col h-full min-h-0 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header & Filters */}
      <div className="shrink-0 p-6 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-slate-50/30">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <DateRangeFilter
            fromDate={fromDate}
            toDate={toDate}
            hideLabel={true}
            onChange={(from, to) => { setFromDate(from); setToDate(to); setPage(1); }}
            onReset={() => { setFromDate(format(subDays(new Date(), 30), 'yyyy-MM-dd')); setToDate(format(new Date(), 'yyyy-MM-dd')); setPage(1); }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:flex-initial">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Invoice or Supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none w-full sm:w-64 placeholder:text-slate-400 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto min-h-0 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 border-b border-slate-200">
            <tr>
              <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Date & Receiver</th>
              <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Supplier</th>
              <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Invoice #</th>
              <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Items Received</th>
              <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Payment</th>
              <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Value</th>
              <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoadingState ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-5 py-5"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                  <td className="px-5 py-5"><div className="h-4 bg-slate-100 rounded w-40"></div></td>
                  <td className="px-5 py-5 text-center"><div className="h-4 bg-slate-100 rounded w-20 mx-auto"></div></td>
                  <td className="px-5 py-5"><div className="h-4 bg-slate-100 rounded w-48"></div></td>
                  <td className="px-5 py-5 text-center"><div className="h-6 bg-slate-100 rounded-full w-16 mx-auto"></div></td>
                  <td className="px-5 py-5 text-right"><div className="h-4 bg-slate-100 rounded w-20 ml-auto"></div></td>
                  <td className="px-5 py-5 text-right"><div className="h-8 bg-slate-100 rounded w-16 ml-auto"></div></td>
                </tr>
              ))
            ) : grns.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mb-5 border border-slate-100 shadow-inner">
                      <Receipt size={32} className="text-slate-200" />
                    </div>
                    <p className="text-sm font-black text-slate-800 uppercase tracking-widest">Zero Receipts Recorded</p>
                    <p className="text-xs text-slate-400 mt-2 font-medium">Capture incoming stock by clicking 'New Receipt'</p>
                  </div>
                </td>
              </tr>
            ) : (
              grns.map((grn) => (
                <tr key={grn.id} className="group hover:bg-slate-50/50 transition-all duration-150">
                  {/* Date & Receiver */}
                  <td className="px-5 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-700">{grn.received_date}</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <User size={10} className="text-slate-400" />
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          {grn.received_by || 'Staff'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Supplier & PO */}
                  <td className="px-5 py-5">
                    <span className="text-sm font-bold text-slate-800 tracking-tight">
                      {grn.supplier?.name || grn.purchase_order?.supplier?.name || 'Direct Supplier'}
                    </span>
                  </td>

                  {/* Invoice # */}
                  <td className="px-5 py-5 text-center">
                    <span className="text-xs font-black text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                      {grn.invoice_number || '—'}
                    </span>
                  </td>

                  {/* Items Received — inline tags */}
                  <td className="px-5 py-5 max-w-xs">
                    <div className="flex flex-wrap gap-2">
                      {grn.items?.length > 0 ? grn.items.map((item, idx) => {
                        const isGroupA = GROUP_A.includes(item.medicine_dosage_form);
                        return (
                          <div key={idx} className="inline-flex flex-col bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 min-w-0 gap-1">
                            {/* Medicine name + dosage form */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-black text-slate-700 leading-tight truncate max-w-[130px]">{item.medicine_name}</span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase">{item.medicine_dosage_form}</span>
                            </div>

                            {/* Batch + Expiry */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                                {item.batch_number}
                              </span>
                              <div className="flex items-center gap-0.5">
                                <Calendar size={7} className="text-slate-300" />
                                <span className="text-[8px] text-slate-400 font-medium">Exp: {item.expiry_date}</span>
                              </div>
                            </div>

                            {/* Qty */}
                            <div className="text-[9px] font-bold text-slate-500">
                              Qty: <span className="text-slate-700">{item.qty_boxes_received} {isGroupA ? 'Box' : 'Unit'}</span>
                            </div>

                            {/* Cost Structure */}
                            {isGroupA ? (
                              <div className="flex flex-wrap gap-x-2 gap-y-0.5 border-t border-slate-100 pt-1 mt-0.5">
                                {item.cost_per_box && (
                                  <span className="text-[8px] font-bold text-emerald-600">৳{parseFloat(item.cost_per_box).toFixed(2)}<span className="text-slate-400 font-medium">/Box</span></span>
                                )}
                                {item.cost_per_stripe && (
                                  <span className="text-[8px] font-bold text-emerald-600">৳{parseFloat(item.cost_per_stripe).toFixed(2)}<span className="text-slate-400 font-medium">/Stripe</span></span>
                                )}
                                {item.cost_per_tablet && (
                                  <span className="text-[8px] font-bold text-emerald-600">৳{parseFloat(item.cost_per_tablet).toFixed(2)}<span className="text-slate-400 font-medium">/Tab</span></span>
                                )}
                                {item.strength && (
                                  <span className="text-[8px] font-bold text-indigo-400">{item.strength}</span>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-x-2 gap-y-0.5 border-t border-slate-100 pt-1 mt-0.5">
                                {item.price && (
                                  <span className="text-[8px] font-bold text-emerald-600">৳{parseFloat(item.price).toFixed(2)}<span className="text-slate-400 font-medium">/Unit</span></span>
                                )}
                                {item.volume && (
                                  <span className="text-[8px] font-bold text-blue-500">{item.volume}</span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      }) : (
                        <span className="text-xs text-slate-300 font-bold">No items</span>
                      )}
                    </div>
                  </td>

                  {/* Payment Status */}
                  <td className="px-5 py-5 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <PaymentStatusBadge status={grn.payment_status} />
                      {parseFloat(grn.paid_amount) > 0 && (
                        <span className="text-[9px] font-bold text-emerald-600 uppercase">
                          Pd: ৳{parseFloat(grn.paid_amount).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Value */}
                  <td className="px-5 py-5 text-right">
                    <span className="text-sm font-black text-slate-900">৳{parseFloat(grn.total_amount).toLocaleString()}</span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-5 text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={(e) => { e.stopPropagation(); onEdit(grn); }}
                        className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all"
                        title="Edit Receipt"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, grn)}
                        disabled={isDeleting}
                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-50"
                        title="Delete & Reverse Stock"
                      >
                        <Trash2 size={16} />
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
      <div className="shrink-0 flex items-center justify-between px-8 py-5 border-t border-slate-100 bg-slate-50/50">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          Page {meta.current_page || 1} of {meta.last_page || 1} &nbsp;·&nbsp; {meta.total || 0} Records
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="p-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm active:scale-95"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setPage(p => Math.min(p + 1, meta.last_page || 1))}
            disabled={page >= (meta.last_page || 1)}
            className="p-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm active:scale-95"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GRNTable;
