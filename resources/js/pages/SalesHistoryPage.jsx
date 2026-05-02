import React, { useState } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { useGetSalesQuery, useUpdateSaleStatusMutation } from '../store/api/salesApi';
import { cn } from '../lib/utils';
import { Toaster, toast } from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';

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

const SalesHistoryPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showDueOnly, setShowDueOnly] = useState(location.state?.showDueOnly || false);
  const [isUpdating, setIsUpdating] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: '',
    to: format(new Date(), 'yyyy-MM-dd')
  });

  const { data: salesData, isLoading, isFetching } = useGetSalesQuery({
    page,
    perPage,
    search: searchTerm,
    status: showDueOnly ? 'Due' : (statusFilter === 'all' ? '' : statusFilter)
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
      toast.success('Payment updated successfully');
    } catch (err) {
      toast.error(err.data?.message || 'Failed to update payment');
    }
  };

  const sales = salesData?.data || [];
  const meta = salesData?.meta || {};

  return (
    <DashboardLayout noScroll>
      <Toaster position="top-right" />
      
      <div className="flex flex-col h-full min-h-0 bg-slate-50/50 -m-6 p-6">
        
        {/* Fixed Header */}
        <div className="shrink-0 mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/pos')}
                className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-400 transition-all shadow-sm group"
              >
                <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                  <History size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sales History</h1>
                  <p className="text-sm font-bold text-slate-400 flex items-center gap-2">
                    Comprehensive record of all pharmacy transactions
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                   setShowDueOnly(!showDueOnly);
                   setStatusFilter('');
                }}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all",
                  showDueOnly 
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-200" 
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                )}
              >
                <BadgeDollarSign size={16} />
                {showDueOnly ? "Show All Sales" : "Show Due Sales"}
              </button>
            </div>
          </div>
        </div>
        {/* Summary Stats */}
        <div className="shrink-0 mb-6">
          <AnimatePresence mode="wait">
            {showDueOnly ? (
              <motion.div 
                key="due-stats"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-6 bg-orange-500 rounded-[2rem] shadow-xl shadow-orange-200 border border-orange-400/20 relative overflow-hidden group max-w-sm"
              >
                <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                  <AlertCircle size={120} />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-orange-100 uppercase tracking-[0.2em] mb-2 opacity-80">Total Outstanding Due</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-orange-200">$</span>
                    <h2 className="text-4xl font-black text-white tracking-tighter">
                      {parseFloat(salesData?.summary?.total_due || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="all-stats"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-6 bg-slate-900 rounded-[2rem] shadow-xl shadow-slate-200 border border-slate-800 relative overflow-hidden group max-w-sm"
              >
                <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                  <BadgeDollarSign size={120} />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total Transaction Volume</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-slate-500">$</span>
                    <h2 className="text-4xl font-black text-white tracking-tighter">
                      {parseFloat(salesData?.summary?.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main Table Card */}
        <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-0">
          
          {/* Table Header / Filters */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1 max-w-3xl">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input
                    type="text"
                    placeholder="Search by invoice number or customer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all placeholder:text-slate-400 text-slate-600"
                  />
                </div>
                
                {!showDueOnly && (
                  <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
                    {['all', 'Completed', 'Returned'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setStatusFilter(f)}
                        className={cn(
                          "px-4 py-1.5 rounded-lg text-xs font-black capitalize transition-all",
                          statusFilter === f || (f === 'all' && statusFilter === '')
                            ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                            : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 text-xs font-bold text-slate-500">
                    <Calendar size={14} /> Date
                    <input 
                      type="date" 
                      value={dateRange.from} 
                      onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                      className="bg-transparent outline-none text-slate-700 w-28 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <select 
                  value={perPage}
                  onChange={(e) => setPerPage(Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 outline-none focus:ring-4 focus:ring-slate-500/5 transition-all cursor-pointer"
                >
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Area */}
          <div className="flex-1 overflow-x-auto custom-scrollbar min-h-0">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead className="sticky top-0 bg-white z-10 border-b border-slate-100 shadow-sm shadow-slate-200/5">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Invoice</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Customer</th>
                  {showDueOnly ? (
                    <>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Phone</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px] text-center">Status</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Due Amount</th>
                    </>
                  ) : (
                    <>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Sold Items</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px] text-center">Sale Unit</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Payment</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Total Amount</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px] text-center">Status</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Date</th>
                    </>
                  )}
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading || isFetching ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      {Array.from({ length: 9 }).map((_, cellIdx) => (
                        <td key={cellIdx} className="px-8 py-6">
                          <div className="h-4 bg-slate-100 rounded-full w-full"></div>
                        </td>
                      ))}
                    </tr>
                  ))
                ) : sales.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-8 py-32">
                      <div className="flex flex-col items-center justify-center gap-4 grayscale opacity-40">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                          <ShoppingBag size={32} />
                        </div>
                        <div className="text-center">
                          <p className="font-black text-slate-900 text-lg tracking-tight">No transactions found</p>
                          <p className="text-sm font-medium text-slate-500">Try adjusting your filters or search term</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sales.map((item) => (
                    <tr key={item.id} className="group hover:bg-slate-50/80 transition-all duration-200">
                      <td className="px-8 py-6">
                        <span className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[11px] font-black border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all font-mono">
                          {item.invoice_number || `INV-${item.id.toString().padStart(6, '0')}`}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] font-black border border-slate-200 transition-colors group-hover:bg-white">
                            {(item.customer_name || 'Walk-in').substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm font-bold text-slate-700">{item.customer_name || 'Walk-in Customer'}</span>
                        </div>
                      </td>

                      {showDueOnly ? (
                        <>
                          <td className="px-8 py-6">
                            <span className="text-xs font-bold text-slate-500">{item.customer_phone || 'N/A'}</span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex justify-center">
                              <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-tight flex items-center gap-1.5",
                                statusStyle[item.status] || 'bg-slate-50 text-slate-400 border-slate-100'
                              )}>
                                <AlertCircle size={10} />
                                {item.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-sm font-black text-orange-600">${parseFloat(item.due_amount || item.grand_total).toFixed(2)}</span>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-8 py-6">
                            <div className="flex flex-col gap-1.5">
                              {Array.isArray(item.items) ? (
                                <>
                                  {item.items.slice(0, 3).map((ritem, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                      <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-700">{ritem.medicine_name}</span>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Batch: {ritem.batch_number}</span>
                                      </div>
                                      <span className="text-[10px] font-black px-1.5 py-0.5 bg-blue-50 text-blue-500 rounded border border-blue-100 italic shrink-0">x{ritem.qty_tablets}</span>
                                    </div>
                                  ))}
                                  {item.items.length > 3 && (
                                    <span className="text-[10px] font-bold text-slate-400 italic mt-1">+ {item.items.length - 3} more items...</span>
                                  )}
                                </>
                              ) : (
                                <span className="text-sm font-bold text-slate-700">{item.items_count || 0} Items</span>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col gap-1 justify-center items-center">
                              {Array.isArray(item.items) ? (
                                item.items.slice(0, 3).map((ritem, idx) => (
                                  <span key={idx} className="text-[10px] font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded uppercase tracking-tighter whitespace-nowrap">
                                    {ritem.sale_unit || 'Tablet'}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded uppercase tracking-tighter">
                                  Tablet
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={cn(
                              "px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-widest",
                              paymentStyle[item.payment_method] || 'bg-slate-50 text-slate-400 border-slate-100'
                            )}>
                              {item.payment_method}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-sm font-black text-slate-900">${parseFloat(item.grand_total).toFixed(2)}</span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex justify-center">
                              <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-tight",
                                statusStyle[item.status] || 'bg-slate-50 text-slate-400 border-slate-100'
                              )}>
                                {item.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-xs font-bold text-slate-500">{format(new Date(item.sale_date || item.date || Date.now()), 'MMM dd, yyyy')}</span>
                          </td>
                        </>
                      )}
                      
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {showDueOnly && (
                            <button 
                              onClick={() => handleUpdatePayment(item.id, item.grand_total)}
                              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all mr-2"
                            >
                              <CheckCircle2 size={14} />
                              Mark Paid
                            </button>
                          )}
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            title="Print Invoice"
                          >
                            <Printer size={16} />
                          </button>
                          <button 
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                            title="More Actions"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {!isLoading && meta.last_page > 1 && (
            <div className="shrink-0 p-6 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[2px]">
                Showing {meta.from}-{meta.to} of {meta.total} transactions
              </p>
              <div className="flex items-center gap-2">
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-400 transition-all shadow-sm"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: meta.last_page }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
                        page === i + 1 
                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
                        : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button 
                  disabled={page === meta.last_page}
                  onClick={() => setPage(page + 1)}
                  className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-400 transition-all shadow-sm"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SalesHistoryPage;
