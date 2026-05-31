import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { motion } from 'framer-motion';
import { 
  Search, 
  History, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw,
  BadgeDollarSign,
  CheckCircle2,
  AlertCircle,
  ShoppingBag
} from 'lucide-react';
import { format } from 'date-fns';
import { useGetSalesQuery, useUpdateSaleStatusMutation } from '../store/api/salesApi';
import { cn } from '../lib/utils';
import { Toaster, toast } from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../language/GlobalTranslate.jsx';

const statusStyle = {
  Completed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  Returned:  'bg-rose-50 text-rose-500 border-rose-100',
  Pending:   'bg-amber-50 text-amber-600 border-amber-100',
  Due:       'bg-orange-50 text-orange-600 border-orange-100',
};

const paymentStyle = {
  Cash: 'bg-slate-100 text-slate-600 border-slate-200',
  Card: 'bg-blue-50 text-blue-600 border-blue-100',
  Online: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  Due: 'bg-orange-50 text-orange-600 border-orange-100',
};

const formatSoldQty = (item) => {
  const qty = Number(item.sale_qty || 0);
  if (qty > 0) return Number.isInteger(qty) ? qty : qty.toFixed(2);

  const tablets = Number(item.qty_tablets || 0);
  if (tablets === 0) return 0;

  if (item.sale_unit === 'Box') {
    const boxQty = tablets / ((item.tablet_per_stripe || 1) * (item.stripe_per_box || 1));
    return Number.isInteger(boxQty) ? boxQty : boxQty.toFixed(2);
  } else if (item.sale_unit === 'Strip') {
    const stripeQty = tablets / (item.tablet_per_stripe || 1);
    return Number.isInteger(stripeQty) ? stripeQty : stripeQty.toFixed(2);
  }
  return tablets;
};

const formatReturnedQty = (item) => {
  const returnedTablets = Number(item.returned_qty_tablets || 0);
  if (returnedTablets === 0) return 0;
  
  const totalTablets = Number(item.qty_tablets || 0);
  const totalSaleQty = Number(item.sale_qty || 1);
  
  if (totalTablets === 0) return 0;
  
  const tabletsPerSaleUnit = totalTablets / totalSaleQty;
  if (tabletsPerSaleUnit === 0) return 0;
  
  const returnedInSaleUnits = returnedTablets / tabletsPerSaleUnit;
  
  return Number.isInteger(returnedInSaleUnits) ? returnedInSaleUnits : returnedInSaleUnits.toFixed(2);
};


const SalesHistoryPage = () => {
  const { translations } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd')
  });

  const { data: salesData, isLoading, isFetching } = useGetSalesQuery({
    page,
    perPage,
    search: searchTerm,
    status: statusFilter === 'all' ? '' : statusFilter,
    from_date: dateRange.from,
    to_date: dateRange.to
  });

  const [updateStatus] = useUpdateSaleStatusMutation();

  const handleUpdatePayment = async (e, id, grandTotal) => {
    e.stopPropagation();
    if (updatingId === id) return;
    setUpdatingId(id);
    try {
      await updateStatus({ 
        id, 
        status: 'Completed',
        paid_amount: grandTotal,
        due_amount: 0 
      }).unwrap();
      toast.success(translations.sales_history.payment_success);
    } catch (err) {
      toast.error(err.data?.message || translations.sales_history.payment_failed);
    } finally {
      setUpdatingId(null);
    }
  };

  const sales = salesData?.data || [];
  const meta = salesData?.meta || {};
  const isLoadingState = isLoading || isFetching;

  // Status filter tabs: All, Completed, Returned, Due
  const statusTabs = [
    { val: 'all',                          lbl: translations.sales_history.all },
    { val: 'Completed',                    lbl: translations.sales_history.completed },
    { val: 'Returned,Partially Returned',  lbl: translations.sales_history.returned },
    { val: 'Due',                          lbl: translations.sales_history.show_due || 'Due' },
  ];

  return (
    <DashboardLayout noScroll>
      <Toaster position="top-right" />
      
      <div className="flex flex-col h-full min-h-0 bg-slate-50/50 -m-6 p-6">
        
        {/* Header */}
        <div className="shrink-0 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                <History size={16} className="text-indigo-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{translations.sales_history.title}</h1>
            </div>
            <p className="text-sm text-slate-500 ml-11">{translations.sales_history.subtitle}</p>
          </div>
        </div>

        {/* Summary Stats — always show all 3 cards */}
        <div className="shrink-0 grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => { setStatusFilter('Completed'); setPage(1); }}
            className={cn(
              "bg-white p-6 rounded-2xl border shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all cursor-pointer",
              statusFilter === 'Completed' ? "border-emerald-300 ring-2 ring-emerald-100" : "border-slate-200"
            )}
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
              <CheckCircle2 size={24} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{translations.sales_history.completed}</p>
              <h3 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                ৳{parseFloat(salesData?.summary?.total_completed || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => { setStatusFilter('Returned,Partially Returned'); setPage(1); }}
            className={cn(
              "bg-white p-6 rounded-2xl border shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all cursor-pointer",
              statusFilter === 'Returned,Partially Returned' ? "border-rose-300 ring-2 ring-rose-100" : "border-slate-200"
            )}
          >
            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
              <RotateCcw size={24} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{translations.sales_history.returned}</p>
              <h3 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                ৳{parseFloat(salesData?.summary?.total_returned || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => { setStatusFilter('Due'); setPage(1); }}
            className={cn(
              "bg-white p-6 rounded-2xl border shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all cursor-pointer",
              statusFilter === 'Due' ? "border-orange-300 ring-2 ring-orange-100" : "border-slate-200"
            )}
          >
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100">
              <AlertCircle size={24} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{translations.sales_history.total_due}</p>
              <h3 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                ৳{parseFloat(salesData?.summary?.total_due || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
          </motion.div>
        </div>

        {/* Main Table Card */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-0">
          
          {/* Filters Row */}
          <div className="shrink-0 p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-6 bg-slate-50/30">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 sm:flex-initial min-w-[280px] group">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder={translations.sales_history.search_placeholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-600"
                />
              </div>

              {/* Status filter tabs — All / Completed / Returned / Due */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                {statusTabs.map(({ val, lbl }) => {
                  const isActive =
                    (val === 'all' && statusFilter === '') ||
                    statusFilter === val;
                  return (
                    <button
                      key={val}
                      onClick={() => { setStatusFilter(val === 'all' ? '' : val); setPage(1); }}
                      className={cn(
                        "px-5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        isActive
                          ? val === 'Due'
                            ? "bg-orange-500 text-white shadow-lg shadow-orange-200"
                            : "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                          : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {lbl}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                <Calendar size={14} className="text-slate-400" />
                <input 
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => { setDateRange(prev => ({...prev, from: e.target.value})); setPage(1); }}
                  className="bg-transparent border-none text-[11px] font-bold text-slate-600 outline-none w-[110px] cursor-pointer"
                />
                <span className="text-slate-300 text-[10px] font-black tracking-widest px-1 uppercase">{translations.pos.to || 'TO'}</span>
                <input 
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => { setDateRange(prev => ({...prev, to: e.target.value})); setPage(1); }}
                  className="bg-transparent border-none text-[11px] font-bold text-slate-600 outline-none w-[110px] cursor-pointer"
                />
              </div>
            </div>

            {(searchTerm || statusFilter || dateRange.from || (dateRange.to && dateRange.to !== format(new Date(), 'yyyy-MM-dd'))) && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setDateRange({ from: '', to: format(new Date(), 'yyyy-MM-dd') });
                  setPage(1);
                }}
                className="text-[10px] font-black text-rose-500 hover:text-rose-700 uppercase tracking-widest px-2 transition-colors"
              >
                {translations.expense.reset || 'RESET'}
              </button>
            )}
          </div>

          {/* Table Area */}
          <div className="flex-1 overflow-x-auto custom-scrollbar min-h-0">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Invoice & Date</th>
                  <th className="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">{translations.sales_history.customer}</th>
                  <th className="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">{translations.medicine.medicine_name || 'Medicine Name'}</th>
                  <th className="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">{translations.medicine.dosage_form || 'Dosage Form'}</th>
                  <th className="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">{translations.sales_history.qty || 'Qty'}</th>
                  <th className="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Returned</th>
                  <th className="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">{translations.expense.amount || 'Amount'}</th>
                  <th className="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">{translations.sales_history.payment}</th>
                  <th className="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">{translations.sales_history.total_amount}</th>
                  <th className="px-4 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">{translations.sales_history.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingState ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      {Array.from({ length: 10 }).map((_, cellIdx) => (
                        <td key={cellIdx} className="px-4 py-5">
                          <div className="h-4 bg-slate-100 rounded-md w-full"></div>
                        </td>
                      ))}
                    </tr>
                  ))
                ) : sales.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-8 py-32 text-center">
                      <div className="flex flex-col items-center justify-center grayscale opacity-40">
                        <div className="w-16 h-16 bg-slate-100 rounded-[1.5rem] flex items-center justify-center mb-4 border border-slate-200">
                          <ShoppingBag size={28} className="text-slate-400" />
                        </div>
                        <p className="font-black text-slate-900 text-lg tracking-tight uppercase">{translations.sales_history.no_transactions}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{translations.sales_history.adjust_filters}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => {
                    const items = sale.items?.length ? sale.items : [null];
                    return items.map((ritem, idx) => {
                      const isFirst = idx === 0;
                      const rowSpan = items.length;
                      return (
                        <tr
                          key={`${sale.id}-${idx}`}
                          className={cn(
                            "transition-colors duration-100 hover:bg-slate-50/60",
                            isFirst ? "border-t-2 border-t-slate-200" : "border-t border-t-indigo-50"
                          )}
                        >
                          {/* Invoice & Date — only on first item row */}
                          {isFirst && (
                            <td className="px-4 py-4 align-top" rowSpan={rowSpan}>
                              <div className="flex flex-col gap-1">
                                <span className="text-sm font-black text-indigo-600 tracking-tight font-mono whitespace-nowrap">
                                  {sale.invoice_number || `INV-${sale.id.toString().padStart(6, '0')}`}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                  <Calendar size={10} className="text-slate-300 shrink-0" />
                                  {format(new Date(sale.sale_date || sale.date || Date.now()), 'MMM dd, yyyy')}
                                </span>
                              </div>
                            </td>
                          )}

                          {/* Customer — only on first item row */}
                          {isFirst && (
                            <td className="px-4 py-4 align-top" rowSpan={rowSpan}>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 shrink-0 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 text-[10px] font-black shadow-sm">
                                  {(sale.customer_name || 'WI').substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-sm font-bold text-slate-700 leading-tight truncate max-w-[110px]">{sale.customer_name || translations.sales_history.walk_in}</span>
                                  <span className="text-[10px] font-medium text-slate-400">{sale.customer_phone || '—'}</span>
                                </div>
                              </div>
                            </td>
                          )}

                          {/* Medicine Name */}
                          <td className={cn(
                            "px-4 py-4",
                            !isFirst && "border-t border-slate-100"
                          )}>
                            {ritem ? (
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-700 leading-tight">{ritem.medicine_name}</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-0.5">Batch: {ritem.batch_number}</span>
                              </div>
                            ) : <span className="text-slate-300 text-xs">—</span>}
                          </td>

                          {/* Dosage Form */}
                          <td className={cn("px-4 py-4 text-center", !isFirst && "border-t border-slate-100")}>
                            {ritem ? (
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-slate-200 whitespace-nowrap">
                                {ritem.sale_unit === 'Tablet' ? (ritem.dosage_form || 'Unit') : ritem.sale_unit === 'Strip' ? 'Stripe' : 'Box'}
                              </span>
                            ) : <span className="text-slate-300 text-xs">—</span>}
                          </td>

                          {/* Qty */}
                          <td className={cn("px-4 py-4 text-center", !isFirst && "border-t border-slate-100")}>
                            {ritem ? (
                              <span className="text-sm font-black text-indigo-600">{formatSoldQty(ritem)}</span>
                            ) : <span className="text-slate-300 text-xs">—</span>}
                          </td>

                          {/* Returned */}
                          <td className={cn("px-4 py-4 text-center", !isFirst && "border-t border-slate-100")}>
                            {ritem ? (
                              <span className={cn(
                                "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border",
                                ritem.returned_qty_tablets > 0
                                  ? "bg-rose-50 text-rose-500 border-rose-100"
                                  : "bg-slate-50 text-slate-400 border-slate-100"
                              )}>
                                {formatReturnedQty(ritem)}
                              </span>
                            ) : <span className="text-slate-300 text-xs">—</span>}
                          </td>

                          {/* Item Amount (subtotal) */}
                          <td className={cn("px-4 py-4 text-right", !isFirst && "border-t border-slate-100")}>
                            {ritem ? (
                              <span className="text-sm font-black text-slate-800">৳{parseFloat(ritem.subtotal).toFixed(2)}</span>
                            ) : <span className="text-slate-300 text-xs">—</span>}
                          </td>

                          {/* Payment — only on first item row */}
                          {isFirst && (
                            <td className="px-4 py-4 text-center align-top" rowSpan={rowSpan}>
                              <span className={cn(
                                "px-3 py-1.5 rounded-lg text-[10px] font-black border uppercase tracking-widest shadow-sm whitespace-nowrap",
                                paymentStyle[sale.payment_method] || 'bg-slate-50 text-slate-400 border-slate-100'
                              )}>
                                {sale.payment_method}
                              </span>
                            </td>
                          )}

                          {/* Grand Total — only on first item row */}
                          {isFirst && (
                            <td className="px-4 py-4 text-right align-top" rowSpan={rowSpan}>
                              <div className="flex flex-col items-end gap-0.5">
                                <span className="text-sm font-black text-slate-900 tracking-tight whitespace-nowrap">
                                  ৳{parseFloat(sale.grand_total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                                {sale.refunded_amount > 0 && (
                                  <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter whitespace-nowrap">
                                    Refunded: ৳{parseFloat(sale.refunded_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </span>
                                )}
                                {sale.due_amount > 0 && (
                                  <span className="text-[9px] font-black text-orange-500 uppercase tracking-tighter whitespace-nowrap">
                                    Due: ৳{parseFloat(sale.due_amount).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </td>
                          )}

                          {/* Status — only on first item row */}
                          {isFirst && (
                            <td className="px-4 py-4 text-center align-top" rowSpan={rowSpan}>
                              {sale.status === 'Due' ? (
                                <button
                                  onClick={(e) => handleUpdatePayment(e, sale.id, sale.grand_total)}
                                  disabled={updatingId === sale.id}
                                  title="Click to mark as Completed"
                                  className={cn(
                                    "group/badge relative px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest shadow-sm transition-all duration-200 whitespace-nowrap",
                                    updatingId === sale.id
                                      ? "bg-orange-50 text-orange-300 border-orange-100 cursor-wait"
                                      : "bg-orange-50 text-orange-600 border-orange-100 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 hover:shadow-emerald-200 cursor-pointer"
                                  )}
                                >
                                  {updatingId === sale.id ? (
                                    <span className="flex items-center gap-1.5 justify-center">
                                      <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                                      </svg>
                                      Saving…
                                    </span>
                                  ) : (
                                    <>
                                      <span className="group-hover/badge:hidden">Due</span>
                                      <span className="hidden group-hover/badge:inline">✓ Complete</span>
                                    </>
                                  )}
                                </button>
                              ) : (
                                <span className={cn(
                                  "px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest shadow-sm whitespace-nowrap",
                                  statusStyle[sale.status] || 'bg-slate-50 text-slate-400 border-slate-100'
                                )}>
                                  {sale.status === 'Completed' ? translations.sales_history.completed : sale.status === 'Returned' ? translations.sales_history.returned : sale.status}
                                </span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    });
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{translations.expense.rows_per_page || 'Rows per page'}</span>
              <select
                value={perPage}
                onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                className="bg-white border border-slate-200 text-xs font-bold text-slate-600 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 cursor-pointer shadow-sm shadow-indigo-100/20 transition-all"
              >
                {[10, 20, 50, 100].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              {!isLoading && meta.total > 0 && (
                <span className="text-xs font-bold text-slate-500 px-3 py-1.5 bg-white rounded-lg border border-slate-200 shadow-sm shadow-indigo-100/20">
                  {translations.sales_history.showing_meta
                    .replace('{from}', meta.from)
                    .replace('{to}', meta.to)
                    .replace('{total}', meta.total)}
                </span>
              )}
              
              <div className="flex items-center gap-1.5">
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="p-2 ml-4 rounded-xl border border-slate-200 hover:bg-white text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm shadow-indigo-100/20"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  disabled={page === meta.last_page}
                  onClick={() => setPage(page + 1)}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-white text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm shadow-indigo-100/20"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SalesHistoryPage;
