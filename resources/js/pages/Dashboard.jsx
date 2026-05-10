import React from 'react';
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
  Smartphone,
  CheckCircle2,
  Package,
  TrendingUp,
  Activity,
  Plus,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '../language/GlobalTranslate.jsx';
import { useGetReportDashboardQuery, useRefreshReportsMutation } from '../store/api/reportsApi';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { translations, language } = useLanguage();
  const navigate = useNavigate();
  const t = translations.dashboard;
  const { data, isLoading, refetch } = useGetReportDashboardQuery();
  const [refreshReports, { isLoading: isRefreshing }] = useRefreshReportsMutation();

  const handleRefresh = async () => {
    try {
      await refreshReports().unwrap();
      refetch();
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  };

  const stats = data?.data || {};
  const summary = stats.summary || {};
  const daily_sales = stats.daily_sales || [];
  const top_medicines = stats.top_medicines || [];
  const payments = stats.payments || [];

  // Generate last 7 days chart data
  const chartData = React.useMemo(() => {
    const values = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const match = daily_sales.find(s => s.date === dateStr);
      values.push(parseFloat(match?.total || 0));
    }
    return { values, max: Math.max(...values, 1) };
  }, [daily_sales]);

  const highestDayInfo = React.useMemo(() => {
    if (daily_sales.length === 0) return t.sales_analysis.today;
    const sorted = [...daily_sales].sort((a, b) => parseFloat(b.total) - parseFloat(a.total));
    return sorted[0].date;
  }, [daily_sales]);

  const totalWeeklySales = chartData.values.reduce((a, b) => a + b, 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">
              {translations.pos?.searching || 'Loading Dashboard...'}
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto space-y-6 pb-10 px-4">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Dashboard Overview</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time Pharmacy Analytics</p>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50 shadow-sm shadow-slate-100"
          >
            <RefreshCw size={14} className={cn(isRefreshing && "animate-spin")} />
            {isRefreshing ? 'REFRESHING...' : 'REFRESH DATA'}
          </button>
        </div>

        {/* Row 1: Key Metrics */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {[
            { label: t.today_sale, val: parseFloat(summary.total_receivable || 0), icon: ShoppingBag, color: 'text-amber-500', bg: 'bg-amber-50', trend: 'Live', trendDesc: 'Updated', trendColor: 'text-emerald-500' },
            { label: t.total_transactions, val: summary.total_transactions || 0, icon: History, color: 'text-slate-500', bg: 'bg-slate-100', trend: 'Total', trendDesc: 'Orders', trendColor: 'text-indigo-500', isNumber: true },
            { label: t.remaining_due, val: parseFloat(stats.remaining_due || 0), icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50', trend: `${stats.due_customers_count || 0} Customers`, trendColor: 'text-rose-500' },
            { label: t.cash_in_hand, val: parseFloat(stats.cash_in_hand || 0), icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-50', trend: `৳ ${(stats.cash_spent_today || 0).toLocaleString()} Spent`, trendColor: 'text-indigo-500' },
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

        {/* Row 2: Main Modern Grid (2 Columns Left Stacked, 1 Large Right) */}
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
                  <h4 className="text-sm font-black text-slate-900 tracking-widest uppercase">Best Selling</h4>
                </div>
              </div>
              <div className="space-y-5 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {top_medicines.slice(0, 5).map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="font-bold text-slate-700">{item.name}</span>
                      <span className="font-black text-slate-500 uppercase text-[10px]">{item.total_qty} units</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((parseFloat(item.total_revenue)/parseFloat(summary.total_receivable || 1))*100, 100)}%` }}
                        className={cn("h-full rounded-full", i === 0 ? 'bg-indigo-500' : 'bg-slate-200')}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Card: Payment Methods */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex-1 flex flex-col min-h-[180px]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <CreditCard size={20} className="text-emerald-500" />
                </div>
                <h4 className="text-sm font-black text-slate-900 tracking-widest uppercase">Payments</h4>
              </div>
              <div className="space-y-4">
                {payments.map((method, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-xs font-bold text-slate-600">{method.payment_method}</span>
                    </div>
                    <span className="text-xs font-black text-slate-900 tracking-tight">৳ {parseFloat(method.total).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Large Column (lg:col-span-3) */}
          <div className="lg:col-span-3 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                  <TrendingUp size={20} className="text-indigo-600" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900 tracking-tight uppercase">Sales Trend</h4>
                  <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Last 7 Working Days</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total 7 Days</p>
                <p className="text-xl font-black text-indigo-600 tracking-tighter">৳ {totalWeeklySales.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex-1 flex items-end justify-between gap-6 px-4 mb-10">
              {chartData.values.map((val, i) => {
                const h = (val / chartData.max) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-4 group h-full">
                    <div className="w-full relative flex-1 flex items-end">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(h, 5)}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className={cn(
                          "w-full rounded-2xl transition-all group-hover:scale-105 cursor-pointer",
                          i === 6 
                            ? "bg-indigo-600 shadow-2xl shadow-indigo-200" 
                            : "bg-indigo-100 group-hover:bg-indigo-200"
                        )}
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded transition-opacity pointer-events-none">
                          ৳ {val.toLocaleString()}
                        </div>
                      </motion.div>
                    </div>
                    <span className={cn("text-[10px] font-black uppercase tracking-tighter transition-colors", i === 6 ? "text-indigo-600" : "text-slate-400")}>
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'][i]}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-50">
              <div className="p-4 rounded-3xl bg-slate-50/50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Highest Selling Day</p>
                <p className="text-sm font-black text-slate-800">{highestDayInfo}</p>
              </div>
              <div className="p-4 rounded-3xl bg-indigo-50/30">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Weekly Average</p>
                <p className="text-sm font-black text-indigo-600 tracking-tight">৳ {(totalWeeklySales/7).toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Alerts & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Alerts Stack (Low Stock & Expiring) */}
          <div className="flex flex-col gap-6">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex-1 min-h-[220px]">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Low Stock</h4>
                <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">{(stats.low_stock_items || []).length} CRITICAL</span>
              </div>
              <div className="space-y-4">
                {(stats.low_stock_items || []).slice(0, 3).map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">{item.name}</span>
                    <span className="text-xs font-black text-rose-500">{item.qty}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex-1 min-h-[220px]">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Expiring Soon</h4>
                <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">{(stats.expiring_items || []).length} BATCHES</span>
              </div>
              <div className="space-y-4">
                {(stats.expiring_items || []).slice(0, 3).map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">{item.name}</span>
                    <span className="text-xs font-black text-amber-500">{item.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Middle: Recent Activities */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col min-h-[460px]">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <Activity size={20} className="text-indigo-500" />
                <h4 className="text-sm font-black text-slate-900 tracking-widest uppercase">Live Activity</h4>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center text-slate-200 gap-4 opacity-30">
              <Activity size={48} strokeWidth={1} />
              <p className="text-[10px] font-black uppercase tracking-widest">No Recent Updates</p>
            </div>
          </div>

          {/* Right: Fast Actions */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col min-h-[460px]">
            <div className="flex items-center gap-3 mb-10">
              <Zap size={20} className="text-amber-500 fill-amber-500" />
              <h4 className="text-sm font-black text-slate-900 tracking-widest uppercase">Quick Actions</h4>
            </div>
            <div className="space-y-4">
              {[
                { label: 'New POS Sale', icon: ShoppingBag, color: 'text-indigo-600', bg: 'bg-indigo-50', path: '/pos' },
                { label: 'Receive Inventory', icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/grn/create' },
                { label: 'Stock Reports', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', path: '/inventory/reports' },
                { label: 'Supplier Dues', icon: Truck, color: 'text-rose-600', bg: 'bg-rose-50', path: '/suppliers' },
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

        {/* Row 4: Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Monthly Revenue', val: parseFloat(summary.total_revenue || 0), trend: '3.2%', color: 'emerald' },
            { label: 'Stock Value', val: parseFloat(stats.total_stock_value || 0), sub: 'IN WAREHOUSE', color: 'indigo' },
            { label: 'Purchase Cost', val: parseFloat(stats.total_purchase_cost || 0), sub: 'THIS MONTH', color: 'slate' },
            { label: 'Estimated Profit', val: parseFloat(stats.estimated_profit || 0), trend: '12%', color: 'emerald' },
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
