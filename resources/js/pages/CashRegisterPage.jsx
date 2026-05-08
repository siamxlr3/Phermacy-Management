import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { 
  useGetTransactionsQuery, 
  useGetRegisterStatusQuery, 
  useRecordTransactionMutation 
} from '../store/api/cashRegisterApi';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Wallet, 
  Plus, 
  History, 
  Search,
  Filter,
  Loader2,
  AlertCircle,
  FileText,
  Calendar,
  RefreshCw,
  Clock,
  BarChart3,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { cn } from '../lib/utils';
import { useLanguage } from '../language/GlobalTranslate.jsx';

const CashRegisterPage = () => {
  const { translations } = useLanguage();
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  
  // Exclusively Outflow now
  const typeFilter = 'Out';

  const { data: statusData, isLoading: isStatusLoading, refetch: refetchStatus } = useGetRegisterStatusQuery();
  const { data: ledgerData, isLoading: isLedgerLoading, isFetching: isLedgerFetching, refetch: refetchLedger } = useGetTransactionsQuery({ 
    from: dateRange.from,
    to: dateRange.to, 
    type: typeFilter, 
    page 
  });

  const handleRefresh = () => {
    refetchStatus();
    refetchLedger();
    toast.success(translations.cash_register.records_updated);
  };

  const summary = statusData?.summary || { current_balance: 0, total_in: 0, total_out: 0, today_in: 0, today_out: 0 };

  const summaryCards = [
    { 
      label: translations.cash_register.cash_in_hand, 
      value: `৳${Number(summary?.current_balance || 0).toLocaleString()}`, 
      icon: Wallet, 
      color: 'indigo',
      desc: translations.cash_register.current_balance_desc,
      bg: 'bg-indigo-50/50',
      iconBg: 'bg-indigo-50',
      iconText: 'text-indigo-600',
    },
    { 
      label: translations.cash_register.total_expenses, 
      value: `৳${Number(summary?.total_out || 0).toLocaleString()}`, 
      icon: TrendingDown, 
      color: 'rose',
      desc: translations.cash_register.spent_today.replace('{amount}', summary?.today_out || 0),
      bg: 'bg-rose-50/50',
      iconBg: 'bg-rose-50',
      iconText: 'text-rose-600',
    }
  ];

  const transactions = ledgerData?.data?.data || [];
  const meta = ledgerData?.data || {};

  return (
    <DashboardLayout noScroll>
      <Toaster position="top-right" />
      
      <div className="flex flex-col h-full min-h-0 bg-slate-50/50 -m-6 p-6">
        
        {/* ── Header Section ── */}
        <div className="shrink-0 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <DollarSign size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{translations.cash_register.title}</h1>
              <p className="text-sm font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest text-[10px]">
                <Clock size={12} className="text-indigo-500" />
                {translations.cash_register.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button 
                onClick={handleRefresh}
                className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                title={translations.cash_register.refresh}
             >
                <RefreshCw size={18} className={cn(isLedgerFetching && "animate-spin")} />
             </button>
          </div>
        </div>

        {/* ── Summary Cards Row ── */}
        <div className="shrink-0 grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {summaryCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all duration-300"
              >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border border-slate-100 transition-colors", card.iconBg, card.iconText)}>
                  <Icon size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
                  {isStatusLoading ? (
                    <div className="h-6 w-24 bg-slate-100 rounded-md animate-pulse mt-1" />
                  ) : (
                    <h3 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">{card.value}</h3>
                  )}
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">{card.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Main Ledger Card ── */}
        <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-0">
          
          {/* Filters Area */}
          <div className="shrink-0 p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 bg-rose-50 text-rose-600 px-4 py-1.5 rounded-lg border border-rose-100 text-[10px] font-black uppercase tracking-widest">
                <TrendingDown size={14} />
                {translations.cash_register.outflow_only}
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                <Calendar size={14} className="text-slate-400" />
                <input 
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({...prev, from: e.target.value}))}
                  className="bg-transparent border-none text-[11px] font-bold text-slate-600 outline-none w-[110px]"
                />
                <ArrowRight size={12} className="text-slate-300" />
                <input 
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({...prev, to: e.target.value}))}
                  className="bg-transparent border-none text-[11px] font-bold text-slate-600 outline-none w-[110px]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {translations.cash_register.showing_records.replace('{n}', transactions.length)}
               </span>
            </div>
          </div>

          {/* Table Area */}
          <div className="flex-1 overflow-x-auto min-h-0 custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 border-b border-slate-100 shadow-sm shadow-slate-200/5">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{translations.cash_register.timestamp}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{translations.cash_register.expenditure_items}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px] text-right">{translations.cash_register.amount_spent}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLedgerLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-8 py-6"><div className="h-4 bg-slate-100 rounded-md w-24"></div></td>
                      <td className="px-8 py-6"><div className="h-4 bg-slate-100 rounded-md w-48"></div></td>
                      <td className="px-8 py-6 text-right"><div className="h-4 bg-slate-100 rounded-md w-20 ml-auto"></div></td>
                    </tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-8 py-32">
                      <div className="flex flex-col items-center justify-center gap-4 grayscale opacity-40">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                          <History size={32} />
                        </div>
                        <div className="text-center">
                          <p className="font-black text-slate-900 text-lg tracking-tight">{translations.cash_register.no_records}</p>
                          <p className="text-sm font-medium text-slate-500">{translations.cash_register.adjust_range}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="group hover:bg-rose-50/30 transition-all duration-200">
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-700">
                             {new Date(tx.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                             {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-50 text-rose-600 border border-rose-100 shadow-sm">
                             <TrendingDown size={14} />
                          </div>
                          <div className="flex flex-col">
                             <span className="text-sm font-bold text-slate-700 max-w-[400px] truncate" title={tx.items}>
                                {tx.items}
                             </span>
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                {translations.cash_register.disbursement}
                             </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className="text-sm font-black tracking-tight text-rose-600">
                           - ৳{Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {!isLedgerLoading && meta.last_page > 1 && (
            <div className="shrink-0 p-6 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[2px]">
                {translations.cash_register.page_meta
                  .replace('{current}', meta.current_page)
                  .replace('{total}', meta.last_page)}
              </p>
              <div className="flex items-center gap-2">
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-1">
                   {Array.from({ length: Math.min(meta.last_page, 5) }).map((_, i) => (
                     <button
                       key={i}
                       onClick={() => setPage(i + 1)}
                       className={cn(
                          "w-9 h-9 rounded-xl text-xs font-black transition-all",
                          page === i + 1 
                            ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" 
                            : "bg-white border border-slate-200 text-slate-400 hover:bg-slate-50"
                       )}
                     >
                       {i + 1}
                     </button>
                   ))}
                </div>
                <button 
                  disabled={page === meta.last_page}
                  onClick={() => setPage(page + 1)}
                  className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm"
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

export default CashRegisterPage;
