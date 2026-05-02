import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calculator, 
  History, 
  Banknote, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  User, 
  ChevronRight,
  MoreVertical,
  Calendar,
  Wallet
} from 'lucide-react';
import { useGetRegisterStatusQuery, useGetRegisterHistoryQuery } from '../store/api/cashRegisterApi';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { Toaster } from 'react-hot-toast';

const CashRegisterPage = () => {
  const [dateRange, setDateRange] = useState({
    from: '',
    to: format(new Date(), 'yyyy-MM-dd')
  });

  const { data: statusData, isLoading: loadingStatus } = useGetRegisterStatusQuery();
  const { data: historyData, isLoading: loadingHistory } = useGetRegisterHistoryQuery(dateRange);
  
  const activeRegister = statusData?.register;
  const history = historyData?.data?.data || [];

  return (
    <DashboardLayout>
      <Toaster position="top-right" />
      <div className="max-w-[1600px] mx-auto p-4 lg:p-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 bg-slate-900 rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-slate-200">
                <Calculator size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Cash Management</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Drawer & Shift Tracking</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
              <div className={cn("w-2 h-2 rounded-full animate-pulse", activeRegister ? "bg-emerald-500" : "bg-slate-300")} />
              <span className="text-xs font-black text-slate-600 uppercase tracking-widest">
                {activeRegister ? "Shift Active" : "Shift Closed"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Active Session & Controls */}
          <div className="lg:col-span-4 space-y-8">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
              Active Session
            </h2>

            {activeRegister ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group"
              >
                {/* Background Decor */}
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-700" />
                
                <div className="relative z-10 space-y-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Session ID</p>
                      <h3 className="text-lg font-black text-slate-900">#REG-{activeRegister.id.toString().padStart(5, '0')}</h3>
                    </div>
                    <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                      In Progress
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <ArrowUpRight size={18} className="text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Opening Balance</p>
                        <p className="text-xl font-black text-slate-900">৳ {parseFloat(activeRegister.opening_balance).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-slate-900 rounded-2xl shadow-xl shadow-slate-200">
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                        <Wallet size={18} className="text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Current Expected</p>
                        <p className="text-xl font-black text-white">৳ {parseFloat(activeRegister.expected_cash).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-50 space-y-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock size={14} />
                      <span className="text-[11px] font-bold">Opened at {format(new Date(activeRegister.opened_at), 'hh:mm a')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <User size={14} />
                      <span className="text-[11px] font-bold">Cashier: Admin Cashier</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-slate-50 rounded-[2.5rem] p-10 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                  <AlertCircle size={32} className="text-slate-300" />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">No Active Session</h3>
                <p className="text-xs text-slate-400 max-w-[200px]">Start a new shift from the POS page to track your cash.</p>
              </div>
            )}
          </div>

          {/* Right Column: History */}
          <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center justify-between ml-2">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                Register History
              </h2>
              
              {/* Date Filters */}
              <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 px-3 border-r border-slate-100">
                  <Calendar size={14} className="text-slate-400" />
                  <input 
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                    className="text-[10px] font-bold text-slate-600 outline-none bg-transparent"
                  />
                </div>
                <div className="flex items-center gap-2 px-3">
                  <span className="text-[10px] font-black text-slate-300 uppercase">To</span>
                  <input 
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                    className="text-[10px] font-bold text-slate-600 outline-none bg-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Session / Date</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Expected</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Counted</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Diff</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {history.map((reg) => (
                      <tr key={reg.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                              <History size={16} />
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-900 tracking-tight">#REG-{reg.id.toString().padStart(5, '0')}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                {format(new Date(reg.shift_date), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span className="text-xs font-black text-slate-600">৳ {parseFloat(reg.expected_cash).toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span className="text-xs font-black text-slate-900">৳ {parseFloat(reg.counted_cash || 0).toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span className={cn(
                            "text-xs font-black px-2 py-1 rounded-lg",
                            parseFloat(reg.difference) === 0 
                              ? "text-emerald-500 bg-emerald-50" 
                              : "text-rose-500 bg-rose-50"
                          )}>
                            {parseFloat(reg.difference) > 0 ? '+' : ''}{parseFloat(reg.difference).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                            reg.status === 'open' 
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                              : "bg-slate-50 text-slate-400 border-slate-100"
                          )}>
                            <div className={cn("w-1 h-1 rounded-full", reg.status === 'open' ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                            {reg.status}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 shadow-sm transition-all text-slate-400 hover:text-slate-900">
                            <ChevronRight size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {history.length === 0 && !loadingHistory && (
                      <tr>
                        <td colSpan="6" className="px-8 py-20 text-center">
                          <div className="flex flex-col items-center">
                            <History size={40} className="text-slate-200 mb-4" />
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No History Found</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CashRegisterPage;
