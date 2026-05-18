import React, { useState, useEffect } from 'react';
import { useGetPurchaseOrdersQuery, useDeletePurchaseOrderMutation, useUpdatePurchaseOrderStatusMutation } from '../../store/api/purchaseApi';
import { Search, Plus, Trash2, ShoppingBag, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, CreditCard, Edit2, Boxes, Droplets } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import DateRangeFilter from '../Shared/DateRangeFilter';
import { format, subDays } from 'date-fns';
import GRNForm from '../GRN/GRNForm';
import { useLanguage } from '../../language/GlobalTranslate.jsx';

const GROUP_A = ['Tablet', 'Capsule', 'Suppository', 'Patch'];

const StatusBadge = ({ status, translations }) => {
  const styles = {
    Pending: 'bg-amber-50 text-amber-700 border-amber-100',
    Received: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Cancelled: 'bg-red-50 text-red-700 border-red-100',
  };
  const labels = {
    Pending: translations.purchase_order.pending,
    Received: translations.purchase_order.received,
    Cancelled: translations.purchase_order.cancelled,
  };
  const icons = {
    Pending: <Clock size={10} />,
    Received: <CheckCircle2 size={10} />,
    Cancelled: <XCircle size={10} />,
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${styles[status]}`}>
      {icons[status]}
      {labels[status] || status}
    </span>
  );
};

const PaymentStatusBadge = ({ status, translations }) => {
  const styles = {
    Pending: 'bg-slate-50 text-slate-600 border-slate-100',
    'Partially Paid': 'bg-blue-50 text-blue-700 border-blue-100',
    Paid: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    Due: 'bg-rose-50 text-rose-700 border-rose-100',
  };
  const labels = {
    Pending: translations.purchase_order.pending,
    'Partially Paid': translations.purchase_order.partially_paid,
    Paid: translations.purchase_order.paid,
    Due: translations.purchase_order.due,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter border ${styles[status] || styles.Pending}`}>
      <CreditCard size={9} />
      {labels[status] || status}
    </span>
  );
};

const PurchaseOrderTable = () => {
  const { translations } = useLanguage();
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, isLoading, isFetching } = useGetPurchaseOrdersQuery({
    page,
    perPage,
    search: debouncedSearch,
    status: statusFilter,
    from_date: fromDate,
    to_date: toDate,
  });

  const [deleteOrder] = useDeletePurchaseOrderMutation();
  const [updateStatus] = useUpdatePurchaseOrderStatusMutation();

  const handleDelete = async (id) => {
    if (!confirm(translations.purchase_order.delete_confirm)) return;
    try {
      await deleteOrder(id).unwrap();
      toast.success(translations.purchase_order.delete_success);
    } catch (err) {
      toast.error(err?.data?.message || translations.purchase_order.delete_failed);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updateStatus({ id, status: newStatus }).unwrap();
      toast.success(translations.purchase_order.status_updated.replace('{status}', newStatus));
    } catch (err) {
      toast.error(err?.data?.message || translations.purchase_order.update_failed);
    }
  };

  const orders = data?.data || [];
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
            onReset={() => { setFromDate(format(subDays(new Date(), 30), 'yyyy-MM-dd')); setToDate(format(new Date(), 'yyyy-MM-dd')); }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-slate-600 font-bold min-w-[150px] shadow-sm transition-all"
          >
            <option value="">{translations.purchase_order.all_statuses}</option>
            <option value="Received">{translations.purchase_order.received}</option>
            <option value="Paid">{translations.purchase_order.paid}</option>
            <option value="Due">{translations.purchase_order.due}</option>
          </select>

          <div className="relative flex-1 sm:flex-initial">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={translations.purchase_order.search_placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none w-full sm:w-64 font-medium transition-all"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto min-h-0 custom-scrollbar">
        {orders.length === 0 && !isLoadingState ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-6 border border-slate-100 shadow-inner">
              <ShoppingBag size={32} className="text-slate-200" />
            </div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-2">{translations.purchase_order.no_orders}</h3>
            <p className="text-sm text-slate-400 mb-8 max-w-xs mx-auto font-medium">
              {translations.purchase_order.no_orders_desc}
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 border-b border-slate-200">
              <tr>
                <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">{translations.purchase_order.supplier_col}</th>
                <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Invoice #</th>
                <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">{translations.purchase_order.items_col}</th>
                <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">{translations.purchase_order.payment_col}</th>
                <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">{translations.purchase_order.value_col}</th>
                <th className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">{translations.purchase_order.status_col}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingState ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-5"><div className="h-4 bg-slate-100 rounded w-36"></div></td>
                    <td className="px-5 py-5 text-center"><div className="h-4 bg-slate-100 rounded w-20 mx-auto"></div></td>
                    <td className="px-5 py-5"><div className="h-4 bg-slate-100 rounded w-48"></div></td>
                    <td className="px-5 py-5 text-center"><div className="h-6 bg-slate-100 rounded-full w-16 mx-auto"></div></td>
                    <td className="px-5 py-5 text-right"><div className="h-4 bg-slate-100 rounded w-20 ml-auto"></div></td>
                    <td className="px-5 py-5 text-center"><div className="h-6 bg-slate-100 rounded-full w-20 mx-auto"></div></td>
                  </tr>
                ))
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="group hover:bg-slate-50/50 transition-all duration-150">


                    {/* Supplier */}
                    <td className="px-5 py-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                          <ShoppingBag size={14} className="text-slate-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800 truncate">{order.supplier?.name || '—'}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{format(new Date(order.order_date), 'dd MMM yyyy')}</span>
                        </div>
                      </div>
                    </td>

                    {/* Invoice # */}
                    <td className="px-5 py-5 text-center">
                      <span className="text-xs font-black text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                        {`PO-${String(order.id).padStart(6, '0')}`}
                      </span>
                    </td>

                    {/* Items Ordered — inline tags */}
                    <td className="px-5 py-5 max-w-xs">
                      <div className="flex flex-wrap gap-1.5">
                        {order.items?.length > 0 ? order.items.map((item, idx) => {
                          const isStripBased = GROUP_A.includes(item.dosage_form_snapshot);
                          return (
                            <div key={idx} className="inline-flex flex-col bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1.5 min-w-0">
                              <div className="flex items-center gap-1.5">
                                {isStripBased
                                  ? <Boxes size={9} className="text-slate-400 shrink-0" />
                                  : <Droplets size={9} className="text-slate-400 shrink-0" />
                                }
                                <span className="text-[10px] font-black text-slate-700 truncate max-w-[120px]">{item.medicine_name}</span>
                              </div>
                              <div className="flex flex-col gap-0.5 mt-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-bold text-slate-500">
                                    {item.qty_boxes} <span className="text-[8px] uppercase">Boxes</span>
                                  </span>
                                  <span className="text-[8px] text-slate-300">•</span>
                                  <span className="text-[9px] font-bold text-emerald-600">
                                    ৳{parseFloat(item.cost_per_box).toFixed(2)} / box
                                  </span>
                                </div>
                                <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-tighter">
                                  ৳{parseFloat(item.cost_per_unit).toFixed(2)} / unit
                                </span>
                              </div>
                            </div>
                          );
                        }) : (
                          <span className="text-xs text-slate-300 font-bold">{translations.purchase_order.no_items}</span>
                        )}
                      </div>
                    </td>

                    {/* Payment */}
                    <td className="px-5 py-5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <PaymentStatusBadge status={order.payment_status} translations={translations} />
                        {order.payment_status === 'Paid' ? (
                          <span className="text-[9px] font-bold text-emerald-600 uppercase">৳{parseFloat(order.total_amount).toLocaleString()}</span>
                        ) : order.paid_amount > 0 ? (
                          <span className="text-[9px] font-bold text-blue-500 uppercase">{translations.purchase_order.pd_label}{parseFloat(order.paid_amount).toLocaleString()}</span>
                        ) : null}
                      </div>
                    </td>

                    {/* Value */}
                    <td className="px-5 py-5 text-right">
                      <span className="text-sm font-black text-slate-900">৳{parseFloat(order.total_amount).toLocaleString()}</span>
                    </td>

                    {/* Order Status */}
                    <td className="px-5 py-5 text-center">
                      <StatusBadge status={order.status} translations={translations} />
                    </td>


                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="shrink-0 flex items-center justify-between px-8 py-5 border-t border-slate-100 bg-slate-50/50">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          {translations.purchase_order.page_meta
            .replace('{current}', meta.current_page || 1)
            .replace('{total}', meta.last_page || 1)
            .replace('{total_records}', meta.total || 0)}
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

      {/* New/Edit Order Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl"
            >
              <GRNForm
                mode="PO"
                grn={editingOrder}
                onClose={() => { setIsFormOpen(false); setTimeout(() => setEditingOrder(null), 300); }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PurchaseOrderTable;
