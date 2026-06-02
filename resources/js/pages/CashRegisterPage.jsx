import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { 
  useGetTransactionsQuery, 
  useGetRegisterStatusQuery,
} from '../store/api/cashRegisterApi';
import { 
  Wallet, 
  History, 
  Calendar,
  RefreshCw,
  Clock,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Tag,
  User,
  CreditCard,
  Link2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { cn } from '../lib/utils';
import { useLanguage } from '../language/GlobalTranslate.jsx';

const TX_TYPE_STYLES = {
  In:          { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Cash In',     sign: '+', color: 'text-emerald-600' },
  Out:         { bg: 'bg-rose-50',    text: 'text-rose-700',    label: 'Withdrawal',  sign: '-', color: 'text-rose-600'    },
  sale_refund: { bg: 'bg-amber-50',   text: 'text-amber-700',   label: 'Sale Refund', sign: '-', color: 'text-amber-600'   },
  expense:     { bg: 'bg-purple-50',  text: 'text-purple-700',  label: 'Expense',     sign: '-', color: 'text-purple-600'  },
  grn_payment: { bg: 'bg-indigo-50',  text: 'text-indigo-700',  label: 'GRN Payment', sign: '-', color: 'text-indigo-600'  },
  grn_reversal: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'GRN Reversal', sign: '+', color: 'text-emerald-600' },
  expense_reversal: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Expense Reversal', sign: '+', color: 'text-emerald-600' },
};

const PARTY_TYPE_STYLES = {
  customer: 'bg-blue-50 text-blue-600',
  supplier: 'bg-orange-50 text-orange-600',
  other:    'bg-slate-100 text-slate-500',
};

const CashRegisterPage = () => {
  const { translations } = useLanguage();
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA'),
    to: new Date().toLocaleDateString('en-CA'),
  });
  const [txTypeFilter, setTxTypeFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  const { data: statusData, isLoading: isStatusLoading, refetch: refetchStatus } = useGetRegisterStatusQuery();
  const { data: ledgerData, isLoading: isLedgerLoading, isFetching: isLedgerFetching, refetch: refetchLedger } = useGetTransactionsQuery({
    from: dateRange.from,
    to: dateRange.to,
    transaction_type: txTypeFilter,
    payment_method: paymentFilter,
    page,
  });

  const handleRefresh = () => {
    refetchStatus();
    refetchLedger();
    toast.success(translations.cash_register.records_updated);
  };

  const summary = statusData?.summary || { current_balance: 0, total_in: 0, total_out: 0, today_in: 0, today_out: 0 };
  const transactions = ledgerData?.data || [];
  const meta = ledgerData?.meta || { current_page: 1, last_page: 1, total: 0 };

  const summaryCards = [
    { 
      label: translations.cash_register.cash_in_hand,
      value: `৳${Number(summary.current_balance || 0).toLocaleString()}`,
      icon: Wallet, iconBg: 'bg-indigo-50', iconText: 'text-indigo-600',
      desc: translations.cash_register.current_balance_desc,
    },
    {
      label: translations.cash_register.total_cash_in,
      value: `৳${Number(summary.total_in || 0).toLocaleString()}`,
      icon: TrendingUp, iconBg: 'bg-emerald-50', iconText: 'text-emerald-600',
      desc: `Today: ৳${Number(summary.today_in || 0).toLocaleString()}`,
    },
    {
      label: translations.cash_register.total_expenses,
      value: `৳${Number(summary.total_out || 0).toLocaleString()}`,
      icon: TrendingDown, iconBg: 'bg-rose-50', iconText: 'text-rose-600',
      desc: translations.cash_register.spent_today?.replace('{amount}', Number(summary.today_out || 0).toLocaleString()) || `Spent today: ৳${Number(summary.today_out || 0).toLocaleString()}`,
    },
  ];

  return (
    <DashboardLayout noScroll>
      <Toaster position="top-right" />
      <div className="flex flex-col h-full min-h-0 bg-slate-50/50 -m-6 p-6">

        {/* Header */}
        <div className="shrink-0 mb-6 flex items-end justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <DollarSign size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{translations.cash_register.title}</h1>
              <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest mt-0.5">
                <Clock size={12} className="text-indigo-500" />
                {translations.cash_register.subtitle}
              </p>
            </div>
          </div>
          <button onClick={handleRefresh} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm" title={translations.cash_register.refresh}>
            <RefreshCw size={18} className={cn(isLedgerFetching && "animate-spin")} />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="shrink-0 grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {summaryCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div key={idx} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.07 }}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center border border-slate-100", card.iconBg, card.iconText)}>
                  <Icon size={22} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
                  {isStatusLoading
                    ? <div className="h-6 w-24 bg-slate-100 rounded-md animate-pulse mt-1" />
                    : <h3 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">{card.value}</h3>}
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">{card.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Main Ledger */}
        <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-0">

          {/* Filters */}
          <div className="shrink-0 p-5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center gap-4">
            {/* Date range */}
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
              <Calendar size={14} className="text-slate-400" />
              <input type="date" value={dateRange.from} onChange={(e) => setDateRange(p => ({ ...p, from: e.target.value }))}
                className="bg-transparent text-[11px] font-bold text-slate-600 outline-none w-[110px]" />
              <ArrowRight size={12} className="text-slate-300" />
              <input type="date" value={dateRange.to} onChange={(e) => setDateRange(p => ({ ...p, to: e.target.value }))}
                className="bg-transparent text-[11px] font-bold text-slate-600 outline-none w-[110px]" />
            </div>

            {/* Removed Transaction type and Payment method filters as requested */}

            <span className="ml-auto text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {translations.cash_register.showing_records.replace('{n}', meta.total || transactions.length)}
            </span>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-x-auto min-h-0 custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 border-b border-slate-100 shadow-sm">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{translations.cash_register.timestamp}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{translations.cash_register.type}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{translations.cash_register.description}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{translations.cash_register.reference}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{translations.cash_register.party}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{translations.cash_register.method}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px] text-right">{translations.cash_register.amount}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px] text-right">{translations.cash_register.balance}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLedgerLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-6 py-5"><div className="h-4 bg-slate-100 rounded-md w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-8 py-32">
                      <div className="flex flex-col items-center justify-center gap-4 grayscale opacity-40">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center"><History size={32} /></div>
                        <div className="text-center">
                          <p className="font-black text-slate-900 text-lg tracking-tight">{translations.cash_register.no_records}</p>
                          <p className="text-sm font-medium text-slate-500">{translations.cash_register.adjust_range}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const style = TX_TYPE_STYLES[tx.transaction_type] || TX_TYPE_STYLES.Out;
                    const isDebit = ['Out', 'sale_refund', 'expense', 'grn_payment'].includes(tx.transaction_type);
                    return (
                      <tr key={tx.id} className="group hover:bg-slate-50/60 transition-all duration-150">

                        {/* Timestamp */}
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-700">
                              {new Date(tx.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                              {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </td>

                        {/* Type badge */}
                        <td className="px-6 py-5">
                          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider", style.bg, style.text)}>
                            {isDebit ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
                            {style.label}
                          </span>
                        </td>

                        {/* Description */}
                        <td className="px-6 py-5 max-w-[200px]">
                          <span className="text-sm font-bold text-slate-700 truncate block" title={tx.description}>
                            {tx.description || '—'}
                          </span>
                        </td>

                        {/* Reference */}
                        <td className="px-6 py-5">
                          {tx.reference_number ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md w-fit">
                                <Link2 size={9} /> {tx.reference_number}
                              </span>
                              {tx.reference_type && (
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{tx.reference_type.replace('_', ' ')}</span>
                              )}
                            </div>
                          ) : <span className="text-slate-300 text-xs">—</span>}
                        </td>

                        {/* Party */}
                        <td className="px-6 py-5">
                          {tx.party_name ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                <User size={10} className="text-slate-400" /> {tx.party_name}
                              </span>
                              <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded w-fit", PARTY_TYPE_STYLES[tx.party_type] || PARTY_TYPE_STYLES.other)}>
                                {tx.party_type}
                              </span>
                            </div>
                          ) : <span className="text-slate-300 text-xs">—</span>}
                        </td>

                        {/* Payment method */}
                        <td className="px-6 py-5">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                            <CreditCard size={10} /> {tx.payment_method || 'cash'}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="px-6 py-5 text-right whitespace-nowrap">
                          <span className={cn("text-sm font-black tracking-tight", style.color)}>
                            {style.sign} ৳{Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </td>

                        {/* Running balance */}
                        <td className="px-6 py-5 text-right whitespace-nowrap">
                          <span className="text-xs font-black text-slate-700">
                            ৳{Number(tx.balance_after).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLedgerLoading && meta.last_page > 1 && (
            <div className="shrink-0 p-5 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[2px]">
                {translations.cash_register.page_meta
                  .replace('{current}', meta.current_page)
                  .replace('{total}', meta.last_page)}
              </p>
              <div className="flex items-center gap-2">
                <button disabled={page === 1} onClick={() => setPage(page - 1)}
                  className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm">
                  <ChevronLeft size={20} />
                </button>
                {(() => {
                  const total = meta.last_page || 1;
                  const current = meta.current_page || 1;
                  const maxVisible = 5;
                  let start = Math.max(1, current - Math.floor(maxVisible / 2));
                  let end = Math.min(total, start + maxVisible - 1);
                  if (end - start + 1 < maxVisible) {
                    start = Math.max(1, end - maxVisible + 1);
                  }
                  
                  return Array.from({ length: end - start + 1 }, (_, i) => start + i).map((p) => (
                    <button key={p} onClick={() => setPage(p)}
                      className={cn("w-9 h-9 rounded-xl text-xs font-black transition-all",
                        page === p ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" : "bg-white border border-slate-200 text-slate-400 hover:bg-slate-50")}>
                      {p}
                    </button>
                  ));
                })()}
                <button disabled={page === meta.last_page} onClick={() => setPage(page + 1)}
                  className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm">
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
