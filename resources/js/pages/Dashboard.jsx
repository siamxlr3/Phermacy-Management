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

  // Date filters
  const [dateRange, setDateRange] = useState({
    from_date: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    to_date: format(new Date(), 'yyyy-MM-dd')
  });

  const { data: response, isLoading, refetch, isFetching } = useGetReportDashboardQuery(dateRange);
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
  const metrics = {
    total_sales: summary.total_completed || 0,
    total_transactions: summary.total_transactions || 0,
    remaining_due: dashboardData.remaining_due || 0,
    cash_in_hand: dashboardData.cash_in_hand || 0,
    stock_value: dashboardData.total_stock_value || 0,
    purchase_cost: dashboardData.total_purchase_cost || 0,
    estimated_profit: dashboardData.estimated_profit || 0,
    low_stock_count: dashboardData.low_stock_items?.length || 0,
    expiring_soon_count: dashboardData.expiring_items?.length || 0,
    returns_count: dashboardData.returns_count || 0,
  };
  
  const low_stock_items = dashboardData.low_stock_items || [];
  const expiring_items = dashboardData.expiring_items || [];
  const monthly_revenue = dashboardData.monthly_revenue || []; 
  const daily_sales = dashboardData.daily_sales || [];
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
        
        {/* Header & Date Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{t?.title || 'Dashboard Overview'}</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{t?.subtitle || 'Real-time Pharmacy Analytics'}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range Picker UI */}
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm shadow-slate-100">
              <Calendar size={14} className="text-indigo-500" />
              <input 
                type="date" 
                value={dateRange.from_date}
                onChange={(e) => setDateRange(prev => ({ ...prev, from_date: e.target.value }))}
                className="text-[11px] font-black uppercase text-slate-600 outline-none border-none bg-transparent"
              />
              <span className="text-slate-300 mx-1">/</span>
              <input 
                type="date" 
                value={dateRange.to_date}
                onChange={(e) => setDateRange(prev => ({ ...prev, to_date: e.target.value }))}
                className="text-[11px] font-black uppercase text-slate-600 outline-none border-none bg-transparent"
              />
            </div>

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

        {/* Row 1: Key Metrics */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {[
            { label: t?.today_sale || "Sale", val: metrics.total_sales, icon: ShoppingBag, color: 'text-amber-500', bg: 'bg-amber-50', trend: t?.selected_range || 'Selected Range', trendDesc: t?.total_revenue || 'Total Revenue', trendColor: 'text-emerald-500' },
            { label: t?.total_transactions || "Transactions", val: metrics.total_transactions, icon: History, color: 'text-slate-500', bg: 'bg-slate-100', trend: t?.total || 'Total', trendDesc: t?.invoices || 'Invoices', trendColor: 'text-indigo-500', isNumber: true },
            { label: t?.remaining_due || "Due", val: metrics.remaining_due, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50', trend: t?.awaiting || 'Awaiting', trendDesc: t?.collection || 'Collection', trendColor: 'text-rose-500' },
            { label: t?.cash_in_hand || "Cash", val: metrics.cash_in_hand, icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-50', trend: t?.available || 'Available', trendDesc: t?.in_register || 'In Register', trendColor: 'text-indigo-500' },
          ].map((item, i) => (
            <motion.div 
              key={i}
              variants={itemVariants}
              className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
            >
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", item.bg)}>
                <item.icon size={24} className={item.color} />
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight flex items-baseline gap-1">
                {!item.isNumber && <span className="text-xl">৳</span>}
                {(item.val || 0).toLocaleString()}
              </h3>
              <div className={cn("mt-4 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tight", item.trendColor)}>
                <span className="bg-current opacity-10 px-2 py-0.5 rounded-full">{item.trend}</span>
                <span className="opacity-60">{item.trendDesc || ''}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Row 2: Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Left Stacked Column (lg:col-span-2) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Top Card: Best Selling */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex-1 flex flex-col min-h-[320px]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
                    <Zap size={20} className="text-amber-500" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 tracking-widest uppercase">{translations?.dashboard?.sales_analysis?.best_selling || 'Best Selling'}</h4>
                </div>
              </div>
              <div className="space-y-5 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {best_selling.length > 0 ? best_selling.map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="font-bold text-slate-700">{item.medicine_name}</span>
                      <span className="font-black text-slate-500 uppercase text-[10px]">{item.total_qty} {translations?.dashboard?.sales_analysis?.units || 'units'}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((parseFloat(item.total_revenue) / (metrics.total_sales || 1)) * 100, 100)}%` }}
                        className={cn("h-full rounded-full", i === 0 ? 'bg-indigo-500' : 'bg-slate-200')}
                      />
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center h-full opacity-30 gap-2">
                    <Activity size={32} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-center">{translations?.dashboard?.sales_analysis?.no_sales_data || 'No sales data available'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Card: Payment Methods */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex-1 flex flex-col min-h-[180px]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <CreditCard size={20} className="text-emerald-500" />
                </div>
                <h4 className="text-sm font-black text-slate-900 tracking-widest uppercase">{translations?.dashboard?.sales_analysis?.payments || 'Payments'}</h4>
              </div>
              <div className="space-y-4">
                {payments.length > 0 ? payments.map((method, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{method.payment_method}</span>
                    </div>
                    <span className="text-xs font-black text-slate-900 tracking-tight">৳ {parseFloat(method.total).toLocaleString()}</span>
                  </div>
                )) : (
                   <p className="text-[10px] font-black text-slate-400 text-center uppercase tracking-widest">{translations?.dashboard?.sales_analysis?.no_payment_data || 'No payment data'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Large Column (lg:col-span-3) - Monthly Revenue Trends */}
          <div className="lg:col-span-3 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                  <TrendingUp size={20} className="text-indigo-600" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900 tracking-tight uppercase">{translations?.dashboard?.monthly_summary?.revenue || 'Monthly Revenue'}</h4>
                  <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{translations?.dashboard?.sales_analysis?.performance_year || 'Performance this Year'}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 flex items-end justify-between gap-6 px-4 mb-10">
              {Array.from({ length: 12 }).map((_, i) => {
                const month = i + 1;
                const match = monthly_revenue.find(m => m.month === month);
                const val = match ? parseFloat(match.revenue) : 0;
                const maxRevenue = Math.max(...monthly_revenue.map(m => parseFloat(m.revenue)), 1);
                const h = (val / maxRevenue) * 100;
                const monthName = format(new Date(2024, i, 1), 'MMM');

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-4 group h-full">
                    <div className="w-full relative flex-1 flex items-end">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(h, 5)}%` }}
                        transition={{ duration: 1, delay: i * 0.05 }}
                        className={cn(
                          "w-full rounded-2xl transition-all group-hover:scale-105 cursor-pointer",
                          val > 0 ? "bg-indigo-600 shadow-2xl shadow-indigo-100" : "bg-slate-100 group-hover:bg-slate-200"
                        )}
                      >
                        {val > 0 && (
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded transition-opacity pointer-events-none z-20">
                            ৳ {val.toLocaleString()}
                          </div>
                        )}
                      </motion.div>
                    </div>
                    <span className={cn("text-[10px] font-black uppercase tracking-tighter transition-colors", val > 0 ? "text-indigo-600" : "text-slate-400")}>
                      {monthName}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-50">
              <div className="p-4 rounded-3xl bg-slate-50/50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{translations?.dashboard?.monthly_summary?.revenue || 'Monthly Revenue'}</p>
                <p className="text-sm font-black text-slate-800">৳ {(monthly_revenue.reduce((acc, m) => acc + parseFloat(m.revenue), 0) / (monthly_revenue.length || 1)).toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
              </div>
              <div className="p-4 rounded-3xl bg-indigo-50/30">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{t?.peak_performance || 'Peak Performance'}</p>
                <p className="text-sm font-black text-indigo-600 tracking-tight">৳ {(Math.max(...monthly_revenue.map(m => parseFloat(m.revenue)), 0)).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Alerts & Inventory */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alerts Stack (Low Stock & Expiring) */}
          <div className="flex flex-col gap-6">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex-1 min-h-[220px]">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">{translations?.dashboard?.alerts?.low_stock || 'Low Stock'}</h4>
                <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full uppercase tracking-widest">{metrics.low_stock_count} {translations?.dashboard?.alerts?.items_left || 'Items'}</span>
              </div>
              <div className="space-y-4">
                {low_stock_items.length > 0 ? low_stock_items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">{item.medicine_name}</span>
                    <span className="text-xs font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg">{item.stock} LEFT</span>
                  </div>
                )) : (
                  <p className="text-[10px] font-black text-slate-400 text-center uppercase tracking-widest py-10">Stock Levels Healthy</p>
                )}
              </div>
            </div>
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex-1 min-h-[220px]">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">{translations?.dashboard?.alerts?.expiring || 'Expiring Soon'}</h4>
                <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-widest">{metrics.expiring_soon_count} Batches</span>
              </div>
              <div className="space-y-4">
                {expiring_items.length > 0 ? expiring_items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">{item.medicine_name || item.medicine?.medicine_name || item.name || 'Unknown'}</span>
                    <span className="text-xs font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded-lg">
                      {item.date ? format(new Date(item.date), 'MMM dd, yy') : 'N/A'}
                    </span>
                  </div>
                )) : (
                   <p className="text-[10px] font-black text-slate-400 text-center uppercase tracking-widest py-10">{translations?.dashboard?.alerts?.no_expiring_items || 'No expiring items'}</p>
                )}
              </div>
            </div>
          </div>



          {/* Right: Quick Actions */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col min-h-[460px]">
            <div className="flex items-center gap-3 mb-10">
              <Zap size={20} className="text-amber-500 fill-amber-500" />
              <h4 className="text-sm font-black text-slate-900 tracking-widest uppercase">{translations?.dashboard?.sales_analysis?.quick_actions || 'Quick Actions'}</h4>
            </div>
            <div className="space-y-4">
              {[
                { label: translations?.dashboard?.sales_analysis?.new_pos || 'New POS Sale', icon: ShoppingBag, color: 'text-indigo-600', bg: 'bg-indigo-50', path: '/pos' },
                { label: translations?.dashboard?.sales_analysis?.receive_inventory || 'Receive Inventory', icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/grn/create' },
                { label: translations?.dashboard?.sales_analysis?.stock_reports || 'Stock Reports', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', path: '/inventory/reports' },
                { label: translations?.dashboard?.sales_analysis?.supplier_dues || 'Supplier Dues', icon: Truck, color: 'text-rose-600', bg: 'bg-rose-50', path: '/suppliers' },
              ].map((action, i) => (
                <button 
                  key={i}
                  onClick={() => navigate(action.path)}
                  className="w-full flex items-center justify-between p-5 rounded-3xl bg-slate-50/30 border border-slate-50 hover:bg-white hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-50 transition-all group active:scale-95"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12", action.bg)}>
                      <action.icon size={18} className={action.color} />
                    </div>
                    <span className="text-sm font-black text-slate-700 tracking-tight">{action.label}</span>
                  </div>
                  <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 4: Financial Deep-Dive */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { label: t?.monthly_summary?.revenue || 'Monthly Revenue', val: monthly_revenue.reduce((acc, m) => acc + parseFloat(m.revenue), 0), trend: t?.monthly_summary?.fy_total || 'FY Total', color: 'indigo' },
            { label: t?.monthly_summary?.purchase_cost || 'Purchase Cost', val: metrics.purchase_cost, sub: t?.monthly_summary?.selected_range || 'FOR SELECTED RANGE', color: 'slate' },
            { label: t?.monthly_summary?.estimated_profit || 'Estimated Profit', val: metrics.estimated_profit, trend: `${metrics.total_sales > 0 ? ((metrics.estimated_profit / metrics.total_sales) * 100).toFixed(1) : 0}%`, color: 'emerald' },
            { label: t?.monthly_summary?.stock_valuation || 'Stock Valuation', val: metrics.stock_value, sub: t?.monthly_summary?.total_investment || 'TOTAL INVESTMENT', color: 'indigo' },
            { label: t?.monthly_summary?.customer_returns || 'Customer Returns', val: metrics.returns_count, sub: t?.monthly_summary?.processed_range || 'PROCESSED IN RANGE', color: 'amber', isNumber: true },
            { label: t?.monthly_summary?.supplier_dues || 'Supplier Dues', val: dashboardData.total_supplier_due || 0, sub: t?.monthly_summary?.total_outstanding || 'TOTAL OUTSTANDING', color: 'rose' },
          ].map((item, i) => (
            <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-slate-100 text-[9px] font-black text-slate-500 px-2.5 py-1 rounded-full uppercase tracking-widest">{item.label}</span>
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight flex items-baseline gap-1">
                <span className="text-xl">৳</span>
                {(item.val || 0).toLocaleString()}
              </h3>
              <div className="mt-4 flex items-center gap-1.5">
                {item.trend ? (
                  <span className={cn("text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm", item.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600')}>
                    <ArrowUpRight size={12} /> {item.trend}
                  </span>
                ) : (
                  <span className="text-[10px] font-black text-indigo-500 bg-indigo-50/50 px-3 py-1 rounded-full uppercase tracking-widest">{item.sub}</span>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
