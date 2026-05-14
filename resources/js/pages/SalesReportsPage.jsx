import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar, 
    Filter, 
    Download, 
    RefreshCw, 
    ChevronDown, 
    TrendingUp, 
    BarChart3, 
    CreditCard, 
    Users,
    Clock,
    Search,
    RotateCcw
} from 'lucide-react';
import { useGetReportDashboardQuery, useRefreshReportsMutation } from '../store/api/reportsApi';
import { useGetReturnsQuery } from '../store/api/returnsApi';
import ReportStats from '../components/Reports/ReportStats';
import TopMedicinesTable from '../components/Reports/TopMedicinesTable';
import CategoryRevenue from '../components/Reports/CategoryRevenue';
import { Toaster, toast } from 'react-hot-toast';
import { useLanguage } from '../language/GlobalTranslate.jsx';

const SalesReportsPage = () => {
    const { translations } = useLanguage();
    // Default to last 30 days using local timezone
    const [dateRange, setDateRange] = useState({
        from_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA'),
        to_date: new Date().toLocaleDateString('en-CA')
    });

    const { data: reportData, isLoading, isFetching } = useGetReportDashboardQuery(dateRange);
    const { data: returnsData } = useGetReturnsQuery({ fromDate: dateRange.from_date, toDate: dateRange.to_date, perPage: 5 });
    const [refreshReports, { isLoading: isRefreshing }] = useRefreshReportsMutation();

    const dashboardData = reportData?.data || {};
    const summary = dashboardData.summary || {};
    const top_medicines = dashboardData.top_medicines || [];
    const categories = dashboardData.categories || [];

    const handleRefresh = async () => {
        try {
            await refreshReports().unwrap();
            toast.success(translations.sales_reports.refresh_success);
        } catch (err) {
            toast.error(translations.sales_reports.refresh_failed);
        }
    };

    const quickFilters = [
        { label: translations.sales_reports.today, days: 0 },
        { label: translations.sales_reports.last_7_days, days: 7 },
        { label: translations.sales_reports.last_30_days, days: 30 },
        { label: translations.sales_reports.this_month, type: 'month' }
    ];

    const applyQuickFilter = (filter) => {
        const to = new Date().toISOString().split('T')[0];
        let from;
        
        if (filter.type === 'month') {
            const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            from = firstDay.toISOString().split('T')[0];
        } else {
            from = new Date(Date.now() - filter.days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        }
        
        setDateRange({ from_date: from, to_date: to });
    };

    return (
        <DashboardLayout noScroll>
            <Toaster position="top-right" />
            
            <div className="flex flex-col h-full min-h-0 bg-slate-50/50 -m-6 p-6">
                
                {/* Header Section */}
                <div className="shrink-0 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-indigo-600 rounded-[20px] flex items-center justify-center shadow-xl shadow-indigo-200/50 relative overflow-hidden">
                            <BarChart3 size={28} className="text-white relative z-10" />
                            <motion.div 
                                animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="absolute inset-0 bg-white"
                            />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{translations.sales_reports.title}</h1>
                            <p className="text-sm font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest text-[10px]">
                                <Clock size={12} className="text-indigo-500" />
                                {translations.sales_reports.subtitle}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                            {quickFilters.map((f, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => applyQuickFilter(f)}
                                    className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all"
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                        
                        <button 
                            onClick={handleRefresh}
                            className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm active:scale-95"
                        >
                            <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
                        </button>

                        <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[2px] shadow-lg shadow-slate-900/20 active:scale-95 transition-all">
                            <Download size={14} />
                            {translations.sales_reports.export_data}
                        </button>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="shrink-0 mb-8 flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm min-w-[400px]">
                        <Calendar size={18} className="text-slate-400" />
                        <div className="flex items-center gap-3 flex-1">
                            <input 
                                type="date" 
                                value={dateRange.from_date}
                                onChange={(e) => setDateRange(prev => ({ ...prev, from_date: e.target.value }))}
                                className="bg-transparent border-none outline-none text-xs font-black text-slate-600 w-full"
                            />
                            <span className="text-slate-300 font-bold">{translations.sales_reports.to}</span>
                            <input 
                                type="date" 
                                value={dateRange.to_date}
                                onChange={(e) => setDateRange(prev => ({ ...prev, to_date: e.target.value }))}
                                className="bg-transparent border-none outline-none text-xs font-black text-slate-600 w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Dashboard Content */}
                <div className="flex-1 min-h-0 flex flex-col gap-8 overflow-auto custom-scrollbar pr-2 relative">
                    {(isLoading || isFetching) ? (
                        <div className="space-y-8 animate-pulse">
                            {/* Stats Skeleton */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-40 bg-white rounded-[32px] border border-slate-100 p-6 flex flex-col justify-between">
                                        <div className="flex justify-between items-center">
                                            <div className="w-12 h-12 bg-slate-100 rounded-2xl" />
                                            <div className="w-12 h-6 bg-slate-50 rounded-lg" />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="w-20 h-3 bg-slate-100 rounded-full" />
                                            <div className="w-32 h-8 bg-slate-200 rounded-xl" />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Main Content Skeleton */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                <div className="lg:col-span-8 h-[500px] bg-white rounded-[32px] border border-slate-100 p-8">
                                    <div className="w-48 h-6 bg-slate-100 rounded-full mb-8" />
                                    <div className="space-y-4">
                                        {[1, 2, 3, 4, 5, 6].map(i => (
                                            <div key={i} className="h-12 bg-slate-50 rounded-xl w-full" />
                                        ))}
                                    </div>
                                </div>
                                <div className="lg:col-span-4 space-y-8">
                                    <div className="h-[240px] bg-white rounded-[32px] border border-slate-100 p-8">
                                        <div className="w-40 h-6 bg-slate-100 rounded-full mb-6" />
                                        <div className="flex items-center justify-center pt-4">
                                            <div className="w-32 h-32 rounded-full border-8 border-slate-50" />
                                        </div>
                                    </div>
                                    <div className="h-[240px] bg-white rounded-[32px] border border-slate-100" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Stats Row */}
                            <ReportStats summary={summary} returnsCount={dashboardData.returns_count || 0} />

                            {/* Main Charts/Tables Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[500px]">
                                
                                <div className="lg:col-span-8 flex flex-col h-full">
                                    <TopMedicinesTable medicines={top_medicines} />
                                </div>

                                <div className="lg:col-span-4 flex flex-col h-full gap-8">
                                    <CategoryRevenue categories={categories} />
                                </div>
                            </div>
                        </>
                    )}

                </div>
            </div>
        </DashboardLayout>
    );
};

export default SalesReportsPage;
