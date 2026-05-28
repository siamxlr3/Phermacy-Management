import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, 
  History, 
  BadgeDollarSign, 
  Wallet, 
  AlertTriangle, 
  Clock, 
  Truck,
  Zap,
  ArrowUpRight,
  CreditCard,
  CheckCircle2,
  Package,
  TrendingUp,
  Activity,
  ArrowRight,
  RefreshCw,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useLanguage } from '../language/GlobalTranslate.jsx';
import { useGetReportDashboardQuery, useRefreshReportsMutation } from '../store/api/reportsApi';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const Dashboard = () => {
  const { translations } = useLanguage();
  const navigate = useNavigate();
  const t = translations.dashboard;

  // Filter 1: Stat Cards & Other Metrics
  const [statDateRange, setStatDateRange] = useState({
    from_date: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    to_date: format(new Date(), 'yyyy-MM-dd')
  });

  // Filter 2: Monthly Revenue Chart
  const [trendFilter, setTrendFilter] = useState({
    trend_year: new Date().getFullYear(),
    trend_from_month: 1,
    trend_to_month: 12
  });

  // Fetch dashboard data (Using the same query but passing both filter sets)
  const { data: response, isLoading, refetch, isFetching } = useGetReportDashboardQuery({
    ...statDateRange,
    ...trendFilter
  });
  const [refreshReports, { isLoading: isRefreshing }] = useRefreshReportsMutation();

  const handleRefresh = async () => {
    try {
      await refreshReports().unwrap();
      refetch();
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  };

  const dashboardData = response?.data || {};
  const summary = dashboardData.summary || {};
  const alerts = dashboardData.alerts || {};
  const charts = dashboardData.charts || {};

  const metrics = {
    total_sales: summary.total_revenue || 0,       // Gross revenue (no deductions)
    total_transactions: summary.total_transactions || 0,
    remaining_due: summary.remaining_due || 0,
    cash_in_hand: summary.cash_in_hand || 0,
    stock_value: summary.total_stock_value || 0,
    purchase_cost: summary.total_purchase_cost || 0,
    estimated_profit: summary.estimated_profit || 0,
    gross_profit: summary.gross_profit || 0,
    total_cogs: summary.total_cogs || 0,
    total_expenses: summary.total_expenses || 0,
    low_stock_count: alerts.low_stock?.length || 0,
    expiring_soon_count: alerts.expiring?.length || 0,
    returns_count: summary.total_returns || 0,     // Monetary value of returns (separate card)
  };
  
  const low_stock_items = alerts.low_stock || [];
  const expiring_items = alerts.expiring || [];
  const monthly_revenue = dashboardData.monthly_revenue || [];    // Top-level in API response
  const daily_sales = charts.daily_sales || [];
  const best_selling = dashboardData.top_medicines || [];
  const payments = dashboardData.payments || [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const Skeleton = ({ className }) => (
    <div className={cn("bg-slate-200 animate-pulse rounded-2xl", className)} />
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-[1600px] mx-auto space-y-6 pb-10 px-4">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center mb-2">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-10 w-40 rounded-2xl" />
          </div>

          {/* Metrics Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                <Skeleton className="w-12 h-12 rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-8 w-28" />
                </div>
                <Skeleton className="h-4 w-24 rounded-full" />
              </div>
            ))}
          </div>

          {/* Main Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 h-[320px] space-y-6">
                <Skeleton className="h-6 w-32" />
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-4 w-full" />)}
                </div>
              </div>
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 h-[180px] space-y-6">
                <Skeleton className="h-6 w-32" />
                <div className="space-y-4">
                  {[1, 2].map(i => <Skeleton key={i} className="h-4 w-full" />)}
                </div>
              </div>
            </div>
            <div className="lg:col-span-3 bg-white p-8 rounded-[2.5rem] border border-slate-100 h-[500px] flex flex-col justify-between">
              <Skeleton className="h-8 w-48" />
              <div className="flex items-end justify-between h-64 gap-4 px-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
                  <Skeleton key={i} className="flex-1 rounded-t-xl" style={{ height: `${Math.random() * 80 + 20}%` }} />
                ))}
              </div>
              <div className="flex gap-6 mt-8">
                <Skeleton className="h-16 flex-1" />
                <Skeleton className="h-16 flex-1" />
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto space-y-6 pb-10 px-4">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{t?.title || 'Dashboard Overview'}</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{t?.subtitle || 'Real-time Pharmacy Analytics'}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing || isFetching}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 border border-indigo-500 rounded-2xl text-xs font-black text-white hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-100"
            >
              <RefreshCw size={14} className={cn((isRefreshing || isFetching) && "animate-spin")} />
              {(isRefreshing || isFetching) ? (t?.refreshing || 'REFRESHING...') : (t?.refresh_data || 'REFRESH DATA')}
            </button>
          </div>
        </div>

        {/* Stats Date Filter Row */}
        <div className="flex justify-end mb-2">
           <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm shadow-slate-100">
              <span className="text-[10px] font-black uppercase text-slate-400 mr-2 tracking-widest">Stats Range:</span>
              <Calendar size={14} className="text-indigo-500" />
              <input 
                type="date" 
                value={statDateRange.from_date}
                onChange={(e) => setStatDateRange(prev => ({ ...prev, from_date: e.target.value }))}
                className="text-[11px] font-black uppercase text-slate-600 outline-none border-none bg-transparent"
              />
              <span className="text-slate-300 mx-1">/</span>
              <input 
                type="date" 
                value={statDateRange.to_date}
                onChange={(e) => setStatDateRange(prev => ({ ...prev, to_date: e.target.value }))}
                className="text-[11px] font-black uppercase text-slate-600 outline-none border-none bg-transparent"
              />
            </div>
        </div>

        {/* Row 1: Key Metrics */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {[
            { label: t?.today_sale || "Sale", val: metrics.total_sales, icon: ShoppingBag, color: 'emerald', trend: t?.selected_range || 'Selected Range', trendDesc: t?.total_revenue || 'Total Revenue' },
            { label: t?.total_transactions || "Transactions", val: metrics.total_transactions, icon: History, color: 'indigo', trend: t?.total || 'Total', trendDesc: t?.invoices || 'Invoices', isNumber: true },
            { label: t?.remaining_due || "Due", val: metrics.remaining_due, icon: Clock, color: 'orange', trend: t?.awaiting || 'Awaiting', trendDesc: t?.collection || 'Collection' },
            { label: t?.cash_in_hand || "Cash", val: metrics.cash_in_hand, icon: Wallet, color: 'blue', trend: t?.available || 'Available', trendDesc: t?.in_register || 'In Register' },
          ].map((item, i) => (
            <motion.div 
              key={i}
              variants={itemVariants}
              className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 group relative overflow-hidden"
            >
              <div className={cn(
                "absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 opacity-[0.03] transition-transform duration-700 group-hover:scale-110",
                item.color === 'emerald' ? 'bg-emerald-600' :
                item.color === 'indigo' ? 'bg-indigo-600' :
                item.color === 'orange' ? 'bg-orange-600' : 'bg-blue-600'
              )} />
              
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110 shadow-sm",
                item.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                item.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                item.color === 'orange' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
              )}>
                <item.icon size={24} />
              </div>
              
              <div className="relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-1">{item.label}</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight flex items-baseline gap-1">
                  {!item.isNumber && <span className="text-xl font-bold opacity-40">৳</span>}
                  {(item.val || 0).toLocaleString()}
                </h3>
                
                <div className={cn(
                  "mt-4 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tight",
                  item.color === 'emerald' ? 'text-emerald-600' :
                  item.color === 'indigo' ? 'text-indigo-600' :
                  item.color === 'orange' ? 'text-orange-600' : 'text-blue-600'
                )}>
                  <span className="bg-current opacity-10 px-2 py-0.5 rounded-lg">{item.trend}</span>
                  <span className="opacity-40">{item.trendDesc || ''}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Row 2: Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Left Stacked Column (lg:col-span-2) */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Top Card: Best Selling */}
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex-1 flex flex-col min-h-[340px] group">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[20px] bg-amber-50 flex items-center justify-center shadow-sm group-hover:rotate-12 transition-transform duration-500">
                    <Zap size={22} className="text-amber-500 fill-amber-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 tracking-widest uppercase">{translations?.dashboard?.sales_analysis?.best_selling || 'Best Selling'}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{translations?.dashboard?.sales_analysis?.by_volume || 'By Volume'}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {best_selling.length > 0 ? best_selling.map((item, i) => (
                  <div key={i} className="group/item">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-black text-slate-700 group-hover/item:text-indigo-600 transition-colors uppercase tracking-tight">{item.medicine_name}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{item.generic_name}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[11px] font-black text-slate-900">{item.total_qty} <span className="opacity-40 uppercase">{item.dosage_form || 'Units'}</span></span>
                        <span className="block text-[9px] font-bold text-emerald-500">৳{Number(item.total_revenue).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((parseFloat(item.total_revenue) / (metrics.total_sales || 1)) * 100, 100)}%` }}
                        className={cn("h-full rounded-full transition-all duration-1000", i === 0 ? 'bg-indigo-500' : 'bg-slate-300')}
                      />
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center h-full opacity-20 gap-3 grayscale">
                    <Activity size={40} />
                    <p className="text-[10px] font-black uppercase tracking-[3px] text-center">{translations?.dashboard?.sales_analysis?.no_sales_data || 'No data available'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Card: Payment Methods */}
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col min-h-[200px] group">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-[20px] bg-emerald-50 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <CreditCard size={22} className="text-emerald-500" />
                </div>
                <h4 className="text-sm font-black text-slate-900 tracking-widest uppercase">{translations?.dashboard?.sales_analysis?.payments || 'Payments'}</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {payments.length > 0 ? payments.map((method, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 border border-slate-100 group/pay hover:bg-white hover:shadow-md transition-all">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 group-hover/pay:scale-125 transition-transform" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{method.payment_method}</span>
                    </div>
                    <span className="text-xs font-black text-slate-900 tracking-tight">৳{parseFloat(method.total).toLocaleString()}</span>
                  </div>
                )) : (
                   <p className="col-span-2 text-[10px] font-black text-slate-400 text-center uppercase tracking-widest py-4">No payment records</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Large Column (lg:col-span-3) - Monthly Revenue Trends */}
          <div className="lg:col-span-3 bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm flex flex-col min-h-[580px] group">
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-[24px] bg-indigo-50 flex items-center justify-center shadow-sm shadow-indigo-100 group-hover:rotate-6 transition-transform">
                  <TrendingUp size={28} className="text-indigo-600" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-900 tracking-tight uppercase">{translations?.dashboard?.monthly_summary?.revenue || 'Monthly Revenue'}</h4>
                  <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    {translations?.dashboard?.sales_analysis?.performance_year || 'Performance this Year'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                  {/* Year Select */}
                  <select 
                    value={trendFilter.trend_year}
                    onChange={(e) => setTrendFilter(prev => ({ ...prev, trend_year: parseInt(e.target.value) }))}
                    className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-[10px] font-black text-slate-600 outline-none appearance-none cursor-pointer"
                  >
                    {[new Date().getFullYear(), new Date().getFullYear() - 1].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>

                  <div className="flex items-center bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 gap-2">
                    <select 
                      value={trendFilter.trend_from_month}
                      onChange={(e) => setTrendFilter(prev => ({ ...prev, trend_from_month: parseInt(e.target.value) }))}
                      className="bg-transparent text-[10px] font-black text-slate-600 outline-none cursor-pointer appearance-none"
                    >
                      {Array.from({ length: 12 }).map((_, i) => (
                        <option key={i+1} value={i+1}>{format(new Date(2024, i, 1), 'MMM')}</option>
                      ))}
                    </select>
                    <span className="text-slate-300 text-[10px]">-</span>
                    <select 
                      value={trendFilter.trend_to_month}
                      onChange={(e) => setTrendFilter(prev => ({ ...prev, trend_to_month: parseInt(e.target.value) }))}
                      className="bg-transparent text-[10px] font-black text-slate-600 outline-none cursor-pointer appearance-none"
                    >
                      {Array.from({ length: 12 }).map((_, i) => (
                        <option key={i+1} value={i+1}>{format(new Date(2024, i, 1), 'MMM')}</option>
                      ))}
                    </select>
                  </div>
              </div>
            </div>

            <div className="flex-1 flex items-end justify-between gap-5 px-4 mb-12">
              {Array.from({ length: 12 }).map((_, i) => {
                const month = i + 1;
                // Only show months within the selected range
                if (month < trendFilter.trend_from_month || month > trendFilter.trend_to_month) return null;

                const match = monthly_revenue.find(m => parseInt(m.month) === month);
                const val = match ? parseFloat(match.revenue) : 0;
                const maxRevenue = Math.max(...monthly_revenue.map(m => parseFloat(m.revenue) || 0), 1);
                const h = (val / maxRevenue) * 100;
                const monthName = format(new Date(2024, i, 1), 'MMM');

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-5 group/bar h-full">
                    <div className="w-full relative flex-1 flex items-end">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(h, 5)}%` }}
                        transition={{ duration: 1.2, delay: i * 0.05, ease: "circOut" }}
                        className={cn(
                          "w-full rounded-2xl transition-all duration-500 cursor-pointer relative",
                          val > 0 
                            ? "bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-xl shadow-indigo-100 group-hover/bar:scale-105" 
                            : "bg-slate-50 group-hover/bar:bg-slate-100"
                        )}
                      >
                        {val > 0 && (
                          <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-xl transition-all duration-300 pointer-events-none z-20 whitespace-nowrap">
                            ৳ {val.toLocaleString()}
                          </div>
                        )}
                      </motion.div>
                    </div>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-tighter transition-all duration-300", 
                      val > 0 ? "text-indigo-600 scale-110" : "text-slate-300 group-hover/bar:text-slate-400"
                    )}>
                      {monthName}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-8 pt-10 border-t border-slate-50">
              <div className="p-6 rounded-[32px] bg-slate-50/50 border border-slate-50 hover:bg-white hover:shadow-md transition-all group/info">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover/info:bg-indigo-500 transition-colors" />
                   {translations?.dashboard?.monthly_summary?.avg_revenue || 'Average Monthly'}
                </p>
                <p className="text-lg font-black text-slate-800 tracking-tight">৳ {(monthly_revenue.reduce((acc, m) => acc + parseFloat(m.revenue), 0) / (monthly_revenue.length || 1)).toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
              </div>
              <div className="p-6 rounded-[32px] bg-indigo-50/30 border border-indigo-50/50 hover:bg-white hover:shadow-md transition-all group/peak">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 group-hover/peak:scale-125 transition-all" />
                   {t?.peak_performance || 'Peak Performance'}
                </p>
                <p className="text-lg font-black text-indigo-600 tracking-tight">৳ {(Math.max(...monthly_revenue.map(m => parseFloat(m.revenue)), 0)).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Alerts & Inventory */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Alerts Stack (Low Stock & Expiring) */}
          <div className="flex flex-col gap-8">
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex-1 min-h-[300px] max-h-[400px] flex flex-col group">
              <div className="flex items-center justify-between mb-6 shrink-0">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                      <AlertTriangle size={20} className="text-rose-500" />
                   </div>
                   <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">{translations?.dashboard?.alerts?.low_stock || 'Low Stock'}</h4>
                </div>
                <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-3 py-1 rounded-full uppercase tracking-widest border border-rose-100">{metrics.low_stock_count} {translations?.dashboard?.alerts?.items_left || 'Items'}</span>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {low_stock_items.length > 0 ? low_stock_items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between group/alert p-2.5 hover:bg-rose-50/30 rounded-xl transition-colors border border-transparent hover:border-rose-100">
                    <span className="text-xs font-bold text-slate-600 truncate mr-2 uppercase tracking-tight">{item.medicine_name}</span>
                    <span className="text-[10px] font-black text-rose-500 uppercase bg-white border border-rose-100 px-2 py-0.5 rounded-lg shrink-0 shadow-sm">{item.qty} LEFT</span>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center h-full py-6 gap-2 opacity-30">
                     <CheckCircle2 size={32} className="text-emerald-500" />
                     <p className="text-[10px] font-black uppercase tracking-widest">Stock Levels Healthy</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex-1 min-h-[300px] max-h-[400px] flex flex-col group">
              <div className="flex items-center justify-between mb-6 shrink-0">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Clock size={20} className="text-amber-500" />
                   </div>
                   <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">{translations?.dashboard?.alerts?.expiring || 'Expiring Soon'}</h4>
                </div>
                <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-widest border border-amber-100">{metrics.expiring_soon_count} Batches</span>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {expiring_items.length > 0 ? expiring_items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between group/alert p-2.5 hover:bg-amber-50/30 rounded-xl transition-colors border border-transparent hover:border-amber-100">
                    <span className="text-xs font-bold text-slate-600 truncate mr-2 uppercase tracking-tight">{item.medicine_name || item.medicine?.medicine_name || 'Unknown'}</span>
                    <span className="text-[10px] font-black text-amber-600 uppercase bg-white border border-amber-100 px-2 py-0.5 rounded-lg shrink-0 shadow-sm">
                      {item.date ? format(new Date(item.date), 'MMM dd, yy') : 'N/A'}
                    </span>
                  </div>
                )) : (
                   <p className="text-[10px] font-black text-slate-400 text-center uppercase tracking-widest py-10 opacity-30">No expiring items</p>
                )}
              </div>
            </div>
          </div>

          {/* Right: Quick Actions */}
          <div className="bg-slate-900 p-10 rounded-[48px] shadow-2xl shadow-slate-900/20 flex flex-col min-h-[500px] group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full -ml-24 -mb-24 blur-2xl" />
            
            <div className="flex items-center gap-4 mb-12 relative z-10">
              <div className="w-12 h-12 rounded-[20px] bg-white/10 flex items-center justify-center backdrop-blur-md">
                 <Zap size={24} className="text-amber-400 fill-amber-400" />
              </div>
              <div>
                <h4 className="text-lg font-black text-white tracking-widest uppercase">{translations?.dashboard?.sales_analysis?.quick_actions || 'Quick Actions'}</h4>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Immediate Management</p>
              </div>
            </div>
            
            <div className="space-y-5 relative z-10">
              {[
                { label: translations?.dashboard?.sales_analysis?.new_pos || 'New POS Sale', icon: ShoppingBag, color: 'indigo', path: '/pos' },
                { label: translations?.dashboard?.sales_analysis?.receive_inventory || 'Receive Inventory', icon: Package, color: 'emerald', path: '/grn/create' },
                { label: translations?.dashboard?.sales_analysis?.stock_reports || 'Stock Reports', icon: AlertTriangle, color: 'amber', path: '/inventory/reports' },
                { label: translations?.dashboard?.sales_analysis?.supplier_dues || 'Supplier Dues', icon: Truck, color: 'rose', path: '/suppliers' },
              ].map((action, i) => (
                <button 
                  key={i}
                  onClick={() => navigate(action.path)}
                  className="w-full flex items-center justify-between p-6 rounded-[28px] bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group/btn active:scale-[0.98]"
                >
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "w-12 h-12 rounded-[18px] flex items-center justify-center transition-all group-hover/btn:rotate-12",
                      action.color === 'indigo' ? 'bg-indigo-500/20 text-indigo-400' :
                      action.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                      action.color === 'amber' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                    )}>
                      <action.icon size={22} />
                    </div>
                    <span className="text-sm font-black text-slate-100 tracking-tight uppercase group-hover/btn:translate-x-1 transition-transform">{action.label}</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover/btn:bg-white/20 transition-all">
                     <ArrowRight size={16} className="text-slate-400 group-hover/btn:text-white group-hover/btn:translate-x-1 transition-all" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 4: Financial Deep-Dive */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Estimated Profit */}
          {[
            { label: t?.monthly_summary?.estimated_profit || 'Estimated Profit', val: metrics.estimated_profit, trend: `${metrics.total_sales > 0 ? ((metrics.estimated_profit / metrics.total_sales) * 100).toFixed(1) : 0}%`, color: 'emerald' },
            { label: t?.monthly_summary?.customer_returns || 'Customer Returns', val: metrics.returns_count, sub: t?.monthly_summary?.processed_range || 'PROCESSED IN RANGE', color: 'amber', isNumber: false },
            { label: t?.monthly_summary?.supplier_dues || 'Supplier Dues', val: summary.total_supplier_due || 0, sub: t?.monthly_summary?.total_outstanding || 'TOTAL OUTSTANDING', color: 'rose' },
          ].map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500 group">
              <div className="flex items-center justify-between mb-6">
                <span className="bg-slate-50 text-[9px] font-black text-slate-400 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-slate-100">{item.label}</span>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  item.color === 'emerald' ? 'bg-emerald-500' :
                  item.color === 'amber' ? 'bg-amber-500' : 
                  item.color === 'rose' ? 'bg-rose-500' : 'bg-slate-500'
                )} />
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight flex items-baseline gap-1.5 group-hover:scale-105 transition-transform duration-500 origin-left">
                {!item.isNumber && <span className="text-xl font-bold opacity-30">৳</span>}
                {(item.val || 0).toLocaleString()}
              </h3>
              <div className="mt-6 flex items-center">
                {item.trend ? (
                  <span className="text-[10px] font-black px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm border transition-all bg-emerald-50 text-emerald-600 border-emerald-100">
                    <ArrowUpRight size={14} className="group-hover:rotate-45 transition-transform" /> {item.trend}
                  </span>
                ) : (
                  <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-4 py-1.5 rounded-xl uppercase tracking-widest border border-slate-100 opacity-60">{item.sub}</span>
                )}
              </div>
            </div>
          ))}

          {/* Stock Valuation — Gross Total (no supplier dues deducted) */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500 group">
            <div className="flex items-center justify-between mb-6">
              <span className="bg-slate-50 text-[9px] font-black text-slate-400 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-slate-100">
                {t?.monthly_summary?.stock_valuation || 'Stock Valuation'}
              </span>
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight flex items-baseline gap-1.5 group-hover:scale-105 transition-transform duration-500 origin-left">
              <span className="text-xl font-bold opacity-30">৳</span>
              {(metrics.stock_value || 0).toLocaleString()}
            </h3>
            <div className="mt-4">
              <span className="text-[9px] font-black text-indigo-400 bg-indigo-50 px-3 py-1 rounded-lg uppercase tracking-widest border border-indigo-100 self-start">
                GROSS STOCK VALUE
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
