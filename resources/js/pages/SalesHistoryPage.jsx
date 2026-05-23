import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  History, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  MoreHorizontal, 
  Download,
  ShoppingBag,
  Printer,
  RotateCcw,
  BadgeDollarSign,
  CheckCircle2,
  AlertCircle,
  EyeOff
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

  // Fallback calculation for older records
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
  const [showDueOnly, setShowDueOnly] = useState(location.state?.showDueOnly || false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd')
  });

  const toggleRow = (id) => setExpandedRow(prev => prev === id ? null : id);

  useEffect(() => {
    if (location.state?.showDueOnly !== undefined) {
      setShowDueOnly(location.state.showDueOnly);
    }
  }, [location.state]);

  const { data: salesData, isLoading, isFetching } = useGetSalesQuery({
    page,
    perPage,
    search: searchTerm,
    status: showDueOnly ? 'Due' : (statusFilter === 'all' ? '' : statusFilter),
    from_date: dateRange.from,
    to_date: dateRange.to
  });

  const [updateStatus] = useUpdateSaleStatusMutation();

  const handleUpdatePayment = async (id, grandTotal) => {
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
    }
  };

  const sales = salesData?.data || [];
  const meta = salesData?.meta || {};
  const isLoadingState = isLoading || isFetching;

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

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                 setShowDueOnly(!showDueOnly);
                 setStatusFilter('');
                 setPage(1);
              }}
              className={cn(
                "flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all w-full md:w-auto shadow-lg shadow-indigo-200",
                showDueOnly 
                  ? "bg-orange-500 text-white shadow-orange-200" 
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 shadow-sm"
              )}
            >
              <BadgeDollarSign size={16} />
              {showDueOnly ? translations.sales_history.show_all : translations.sales_history.show_due}
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="shrink-0 grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <AnimatePresence mode="wait">
            {showDueOnly ? (
              <motion.div 
                key="due-stats"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all"
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
            ) : (
              <>
                <motion.div 
                  key="completed-stats"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all"
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
                  key="returned-stats"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all"
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
                  key="due-stats-all"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all"
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
              </>
            )}
          </AnimatePresence>
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

              {!showDueOnly && (
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                  {[['all', translations.sales_history.all], ['Completed', translations.sales_history.completed], ['Returned,Partially Returned', translations.sales_history.returned]].map(([val, lbl]) => (
                    <button
                      key={val}
                      onClick={() => { setStatusFilter(val === 'all' ? '' : val); setPage(1); }}
                      className={cn(
                        "px-5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        (statusFilter === val || (val === 'all' && statusFilter === ''))
                          ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                          : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              )}

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
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">{translations.sales_history.invoice} & {translations.sales_history.date}</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">{translations.sales_history.customer}</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">{translations.sales_history.payment}</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">{translations.sales_history.total_amount}</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">{translations.sales_history.status}</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingState ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      {Array.from({ length: 7 }).map((_, cellIdx) => (
                        <td key={cellIdx} className="px-8 py-6">
                          <div className="h-4 bg-slate-100 rounded-md w-full"></div>
                        </td>
                      ))}
                    </tr>
                  ))
                ) : sales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-32 text-center">
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
                  sales.map((item) => {
                    const isExpanded = expandedRow === item.id;
                    return (
                      <React.Fragment key={item.id}>
                        <tr 
                          onClick={() => toggleRow(item.id)}
                          className={cn(
                            "group transition-all duration-150 cursor-pointer",
                            isExpanded ? "bg-indigo-50/30" : "hover:bg-slate-50/50"
                          )}
                        >
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-black text-indigo-600 tracking-tight font-mono">
                                {item.invoice_number || `INV-${item.id.toString().padStart(6, '0')}`}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Calendar size={10} className="text-slate-300" />
                                {format(new Date(item.sale_date || item.date || Date.now()), 'MMM dd, yyyy')}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 text-[10px] font-black shadow-sm group-hover:border-indigo-200 group-hover:text-indigo-500 transition-colors">
                                {(item.customer_name || 'WI').substring(0, 2).toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-700 leading-tight">{item.customer_name || translations.sales_history.walk_in}</span>
                                <span className="text-[10px] font-medium text-slate-400">{item.customer_phone || 'No phone'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={cn(
                              "px-3 py-1.5 rounded-lg text-[10px] font-black border uppercase tracking-widest shadow-sm",
                              paymentStyle[item.payment_method] || 'bg-slate-50 text-slate-400 border-slate-100'
                            )}>
                              {item.payment_method}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex flex-col items-end">
                              <span className="text-sm font-black text-slate-900 tracking-tight">
                                ৳{parseFloat(item.grand_total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                              {item.refunded_amount > 0 && (
                                <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter">
                                  Refunded: ৳{parseFloat(item.refunded_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                              )}
                              {item.due_amount > 0 && (
                                <span className="text-[9px] font-black text-orange-500 uppercase tracking-tighter">Due: ৳{parseFloat(item.due_amount).toLocaleString()}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest shadow-sm",
                              statusStyle[item.status] || 'bg-slate-50 text-slate-400 border-slate-100'
                            )}>
                              {item.status === 'Completed' ? translations.sales_history.completed : (item.status === 'Returned' ? translations.sales_history.returned : item.status)}
                            </span>
                          </td>
                          <td className="w-10 text-center pr-2">
                            <button
                              className={cn(
                                "p-1.5 rounded-lg transition-all shadow-sm",
                                isExpanded 
                                  ? "bg-indigo-600 text-white shadow-indigo-200" 
                                  : "text-slate-300 hover:text-indigo-600 hover:bg-white opacity-0 group-hover:opacity-100"
                              )}
                            >
                              {isExpanded ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </td>
                        </tr>

                        {/* Expandable Items Sub-Row */}
                        <AnimatePresence>
                          {isExpanded && (
                            <tr>
                              <td colSpan="6" className="p-0 border-b border-indigo-100">
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="bg-indigo-50/40 px-8 py-6">
                                    <div className="flex items-center justify-between mb-4">
                                      <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                        <ShoppingBag size={12} />
                                        {translations.sales_history.sold_items || 'Sold Items'} ({item.items?.length || 0})
                                      </h4>
                                    </div>
                                    <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden">
                                      <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b border-slate-100">
                                          <tr>
                                            <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{translations.medicine.medicine_name || 'Medicine'}</th>
                                            <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">{translations.medicine.dosage_form || 'Unit'}</th>
                                            <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">{translations.sales_history.qty || 'Qty'}</th>
                                            <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Returned</th>
                                            <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">{translations.expense.amount || 'Subtotal'}</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                          {item.items?.map((ritem, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                              <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                  <span className="text-sm font-bold text-slate-700">{ritem.medicine_name}</span>
                                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-0.5">Batch: {ritem.batch_number}</span>
                                                </div>
                                              </td>
                                              <td className="px-6 py-4 text-center">
                                                <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-slate-200">
                                                  {ritem.sale_unit === 'Tablet' ? (ritem.dosage_form || 'Unit') : (ritem.sale_unit === 'Strip' ? 'Stripe' : 'Box')}
                                                </span>
                                              </td>
                                              <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-black text-indigo-600">{formatSoldQty(ritem)}</span>
                                              </td>
                                              <td className="px-6 py-4 text-center">
                                                <span className={cn(
                                                  "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border",
                                                  ritem.returned_qty_tablets > 0 
                                                    ? "bg-rose-50 text-rose-500 border-rose-100" 
                                                    : "bg-slate-50 text-slate-400 border-slate-100"
                                                )}>
                                                  {formatReturnedQty(ritem)}
                                                </span>
                                              </td>
                                              <td className="px-6 py-4 text-right font-black text-slate-900 text-sm">৳{parseFloat(ritem.subtotal).toFixed(2)}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                        <tfoot className="bg-slate-50 border-t border-slate-200">
                                          <tr>
                                            <td colSpan="4" className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">
                                              {translations.sales_history.total_amount || 'Grand Total'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                              <span className="text-base font-black text-indigo-600 tracking-tight">৳{parseFloat(item.grand_total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </td>
                                          </tr>
                                        </tfoot>
                                      </table>
                                    </div>
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
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
