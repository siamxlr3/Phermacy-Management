import React, { useState, useEffect } from 'react';
import { useGetPurchaseOrdersQuery, useDeletePurchaseOrderMutation, useUpdatePurchaseOrderStatusMutation } from '../../store/api/purchaseApi';
import { Search, Plus, Trash2, ShoppingBag, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, CreditCard, Receipt, PackageSearch, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import DateRangeFilter from '../Shared/DateRangeFilter';
import { format, subDays } from 'date-fns';
import PurchaseOrderForm from './PurchaseOrderForm';

const StatusBadge = ({ status }) => {
  const styles = {
    Pending: 'bg-amber-50 text-amber-700 border-amber-100',
    Received: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Cancelled: 'bg-red-50 text-red-700 border-red-100',
  };
  const icons = {
    Pending: <Clock size={10} />,
    Received: <CheckCircle2 size={10} />,
    Cancelled: <XCircle size={10} />,
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status]}`}>
      {icons[status]}
      {status}
    </span>
  );
};

const PaymentStatusBadge = ({ status }) => {
  const styles = {
    Pending: 'bg-slate-50 text-slate-600 border-slate-100',
    'Partially Paid': 'bg-blue-50 text-blue-700 border-blue-100',
    Paid: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    Due: 'bg-rose-50 text-rose-700 border-rose-100',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter border ${styles[status] || styles.Pending}`}>
      {status}
    </span>
  );
};

const EmptyState = ({ onAdd }) => (
  <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
    <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mb-5 border border-slate-100">
      <ShoppingBag size={28} className="text-slate-300" />
    </div>
    <h3 className="text-base font-bold text-slate-800 mb-1">No orders found</h3>
    <p className="text-sm text-slate-400 mb-6 max-w-xs mx-auto">
      Create a new purchase order to restock your inventory and track supplier deliveries.
    </p>
    <button
      onClick={onAdd}
      className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-200"
    >
      <Plus size={16} /> Create Purchase Order
    </button>
  </div>
);

const PurchaseOrderTable = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState(new Set());

  const toggleOrderExpansion = (orderId) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

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
    to_date: toDate
  });

  const [deleteOrder] = useDeletePurchaseOrderMutation();
  const [updateStatus] = useUpdatePurchaseOrderStatusMutation();

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this purchase order?')) {
      try {
        await deleteOrder(id).unwrap();
        toast.success('Order deleted');
      } catch (err) {
        toast.error(err?.data?.message || 'Failed to delete');
      }
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updateStatus({ id, status: newStatus }).unwrap();
      toast.success(`Order marked as ${newStatus}`);
    } catch (err) {
      toast.error(err?.data?.message || 'Update failed');
    }
  };

  const orders = data?.data || [];
  const meta = data?.meta || {};
  const isLoadingState = isLoading || isFetching;

  return (
    <div className="flex flex-col h-full min-h-0 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="shrink-0 p-6 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <DateRangeFilter 
            fromDate={fromDate} 
            toDate={toDate} 
            onChange={(from, to) => { setFromDate(from); setToDate(to); setPage(1); }}
            onReset={() => { setFromDate(format(subDays(new Date(), 30), 'yyyy-MM-dd')); setToDate(format(new Date(), 'yyyy-MM-dd')); }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none text-slate-600 min-w-[130px]"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Received">Received</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <div className="relative flex-1 sm:flex-initial">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search PO # or Supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none w-full sm:w-56 placeholder:text-slate-400"
            />
          </div>

          <button
            onClick={() => { setEditingOrder(null); setIsFormOpen(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm shadow-blue-200 transition-all whitespace-nowrap"
          >
            <Plus size={16} /> New Order
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto min-h-0 custom-scrollbar">
        {orders.length === 0 && !isLoadingState ? (
          <EmptyState onAdd={() => setIsFormOpen(true)} />
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 border-b border-slate-200">
              <tr>
                <th className="w-10 px-6 py-4"></th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Order Details</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Supplier & Items</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Payment Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Total Value</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Order Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingState ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="w-10 px-6 py-4"></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-40"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20 mx-auto"></div></td>
                    <td className="px-6 py-4 text-right"><div className="h-4 bg-slate-100 rounded w-20 ml-auto"></div></td>
                    <td className="px-6 py-4 text-center"><div className="h-6 bg-slate-100 rounded-full w-24 mx-auto"></div></td>
                    <td className="px-6 py-4 text-right"><div className="h-8 bg-slate-100 rounded w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : (
                orders.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr 
                      className={`group cursor-pointer transition-all duration-150 ${expandedOrders.has(order.id) ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}`}
                      onClick={() => toggleOrderExpansion(order.id)}
                    >
                      <td className="w-10 px-6 py-4">
                        {expandedOrders.has(order.id) ? (
                          <ChevronUp size={16} className="text-blue-500" />
                        ) : (
                          <ChevronDown size={16} className="text-slate-300 group-hover:text-slate-400" />
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700">
                            {order.po_number || `#PO-${order.id.toString().padStart(5, '0')}`}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">{order.order_date}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-slate-200 shrink-0 shadow-sm">
                            <ShoppingBag size={14} className="text-slate-500" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-slate-700 truncate">{order.supplier?.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {order.items?.length || 0} Products Ordered
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <PaymentStatusBadge status={order.payment_status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-slate-700">৳{parseFloat(order.total_amount).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all duration-150" onClick={(e) => e.stopPropagation()}>
                          {order.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => { setEditingOrder(order); setIsFormOpen(true); }}
                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Order"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(order.id, 'Received')}
                                className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Mark as Received"
                              >
                                <CheckCircle2 size={16} />
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(order.id, 'Cancelled')}
                                className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                title="Cancel Order"
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          )}

                          <button 
                            onClick={() => handleDelete(order.id)} 
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    <AnimatePresence>
                      {expandedOrders.has(order.id) && (
                        <tr>
                          <td colSpan={7} className="px-6 py-0 bg-blue-50/20">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="py-5 pl-10 pr-6 border-l-4 border-blue-400 mt-2 mb-4 bg-white/60 rounded-r-xl shadow-inner-sm">
                                <div className="flex items-center gap-2 mb-4">
                                  <PackageSearch size={18} className="text-blue-500" />
                                  <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest">Ordered Items List</h4>
                                </div>
                                <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
                                  <table className="w-full text-left text-[11px]">
                                    <thead>
                                      <tr className="bg-slate-50 text-slate-400 font-black uppercase tracking-tighter">
                                        <th className="px-4 py-2">Medicine Product</th>
                                        <th className="px-4 py-2 text-center">Qty (Boxes)</th>
                                        <th className="px-4 py-2 text-right">Unit cost</th>
                                        <th className="px-4 py-2 text-right">Subtotal</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                      {order.items?.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                          <td className="px-4 py-2.5 font-bold text-slate-700">{item.medicine_name}</td>
                                          <td className="px-4 py-2.5 text-center font-medium text-slate-600">{item.qty_boxes}</td>
                                          <td className="px-4 py-2.5 text-right text-slate-500">৳{parseFloat(item.unit_cost).toFixed(2)}</td>
                                          <td className="px-4 py-2.5 text-right font-black text-blue-600">৳{parseFloat(item.subtotal).toFixed(2)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot>
                                      <tr className="bg-blue-50/50">
                                        <td colSpan={3} className="px-4 py-2 text-right font-bold text-slate-600">Total Order Value</td>
                                        <td className="px-4 py-2 text-right font-black text-blue-700 text-sm">৳{parseFloat(order.total_amount).toLocaleString()}</td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                                {order.notes && (
                                  <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100/50">
                                    <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                                      <Receipt size={12} /> Notes / Instructions
                                    </p>
                                    <p className="text-xs text-amber-700 leading-relaxed italic">{order.notes}</p>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Showing {orders.length} orders</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-slate-200 hover:bg-white text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-bold text-slate-600 px-3">Page {meta.current_page || 1} of {meta.last_page || 1}</span>
          <button
            onClick={() => setPage(p => Math.min(p + 1, meta.last_page || 1))}
            disabled={page >= (meta.last_page || 1)}
            className="p-2 rounded-lg border border-slate-200 hover:bg-white text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[60] flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl"
            >
              <PurchaseOrderForm order={editingOrder} onClose={() => { setIsFormOpen(false); setTimeout(() => setEditingOrder(null), 300); }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PurchaseOrderTable;
