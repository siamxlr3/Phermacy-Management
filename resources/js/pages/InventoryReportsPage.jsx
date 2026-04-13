import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { motion } from 'framer-motion';
import { 
    Calendar, 
    Truck, 
    RefreshCw, 
    PackageSearch, 
    Database, 
    AlertTriangle,
    Download,
    Clock
} from 'lucide-react';
import { useGetInventoryReportQuery, useRefreshInventoryReportsMutation } from '../store/api/inventoryReportsApi';
import StockValuationCards from '../components/Reports/StockValuationCards';
import ExpiryRiskTable from '../components/Reports/ExpiryRiskTable';
import SupplierDebtList from '../components/Reports/SupplierDebtList';
import { Toaster, toast } from 'react-hot-toast';

const InventoryReportsPage = () => {
    // Default to a 90-day lookup for expiry tracking
    const [dateRange, setDateRange] = useState({
        from_date: new Date().toISOString().split('T')[0],
        to_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

    const { data: reportData, isLoading, isFetching } = useGetInventoryReportQuery(dateRange);
    const [refreshReports, { isLoading: isRefreshing }] = useRefreshInventoryReportsMutation();

    const handleRefresh = async () => {
        try {
            await refreshReports().unwrap();
            toast.success('Inventory analytics refreshed');
        } catch (err) {
            toast.error('Failed to refresh data');
        }
    };

    const quickFilters = [
        { label: 'Today', days: 0 },
        { label: 'Last 7 Days', days: 7 },
        { label: 'Last 30 Days', days: 30 },
        { label: 'Year to date', type: 'ytd' }
    ];

    const applyQuickFilter = (filter) => {
        const to = new Date().toISOString().split('T')[0];
        let from;
        
        if (filter.type === 'ytd') {
            from = `${new Date().getFullYear()}-01-01`;
        } else {
            from = new Date(Date.now() - filter.days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        }
        
        setDateRange({ from_date: from, to_date: to });
    };

    return (
        <DashboardLayout noScroll>
            <Toaster position="top-right" />
            
            <div className="flex flex-col h-full min-h-0 bg-slate-50/50 -m-6 p-6 overflow-hidden">
                
                {/* Page Header */}
                <div className="shrink-0 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                                <Database size={16} className="text-emerald-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Stock & Purchases</h1>
                        </div>
                        <p className="text-sm text-slate-500 ml-11">General Stock Status & Supplier Bills</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                            {quickFilters.map((f, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => applyQuickFilter(f)}
                                    className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-emerald-600 hover:bg-slate-50 rounded-xl transition-all"
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                        
                        <button 
                            onClick={handleRefresh}
                            className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-emerald-600 transition-all shadow-sm"
                        >
                            <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
                        </button>

                    </div>
                </div>

                {/* Filters Hud */}
                <div className="shrink-0 mb-8 flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm min-w-[350px]">
                        <Calendar size={18} className="text-slate-400" />
                        <div className="flex items-center gap-3 flex-1">
                            <input 
                                type="date" 
                                value={dateRange.from_date}
                                onChange={(e) => setDateRange(prev => ({ ...prev, from_date: e.target.value }))}
                                className="bg-transparent border-none outline-none text-xs font-black text-slate-600 w-full"
                            />
                            <span className="text-slate-300 font-bold text-[10px]">TO</span>
                            <input 
                                type="date" 
                                value={dateRange.to_date}
                                onChange={(e) => setDateRange(prev => ({ ...prev, to_date: e.target.value }))}
                                className="bg-transparent border-none outline-none text-xs font-black text-slate-600 w-full focus:ring-0"
                            />
                        </div>
                    </div>
                    
                    <div className="px-4 py-3 bg-white border border-slate-200 rounded-2xl flex items-center gap-3 shadow-sm border-l-4 border-l-emerald-500">
                        <Clock size={16} className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                            Data updated at <span className="text-slate-900">{new Date().toLocaleTimeString()}</span>
                        </span>
                    </div>
                </div>

                {/* Main Content Hud */}
                <div className="flex-1 min-h-0 flex flex-col gap-8 overflow-auto custom-scrollbar pr-2 pb-6">
                    
                    {/* High Level Metrics */}
                    <StockValuationCards summaries={reportData?.data.summaries} isLoading={isLoading || isFetching} />

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[700px]">
                        
                        {/* Expiry Risk Focus */}
                        <div className="lg:col-span-8 flex flex-col h-full border-r border-slate-100 pr-2">
                            {isLoading || isFetching ? (
                                <div className="space-y-4 animate-pulse p-4">
                                    <div className="h-10 bg-slate-100 rounded-xl w-48 mb-6" />
                                    <div className="space-y-2">
                                        {[1,2,3,4,5].map(i => (
                                            <div key={i} className="h-16 bg-slate-50 rounded-2xl w-full" />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <ExpiryRiskTable risks={reportData?.data.expiry_risks.warning} />
                            )}
                        </div>

                        {/* Debt and Risks Summary */}
                        <div className="lg:col-span-4 flex flex-col h-full gap-8 overflow-hidden">
                            
                            <div className="flex-1 min-h-0">
                                {isLoading || isFetching ? (
                                    <div className="space-y-4 animate-pulse p-4">
                                        <div className="h-10 bg-slate-100 rounded-xl w-48 mb-6" />
                                        <div className="h-40 bg-slate-50 rounded-3xl w-full" />
                                        <div className="h-40 bg-slate-50 rounded-3xl w-full" />
                                    </div>
                                ) : (
                                    <SupplierDebtList dues={reportData?.data.dues} />
                                )}
                            </div>

                            {/* Slow Moving Detection */}
                            <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-black text-slate-900 tracking-tight mb-4 flex items-center gap-2">
                                    <PackageSearch size={18} className="text-indigo-500" />
                                    Items Not Selling
                                </h3>
                                <div className="space-y-4 max-h-[250px] overflow-auto custom-scrollbar pr-2">
                                    {isLoading || isFetching ? (
                                        [1,2,3].map(i => (
                                            <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse w-full" />
                                        ))
                                    ) : (
                                        <>
                                            {reportData?.data.slow_moving.map((med, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-2xl border border-slate-100 group hover:bg-white transition-all">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-700">{med.name}</span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest tracking-tight">
                                                            {med.last_sold_at 
                                                                ? `Last sold ${Math.ceil((new Date() - new Date(med.last_sold_at)) / (1000 * 60 * 60 * 24))} days ago`
                                                                : 'No sales history recorded'}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[11px] font-black text-indigo-600">{med.stock} Units</span>
                                                        <span className="text-[8px] font-black text-slate-300 uppercase italic">Idle Stock</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {reportData?.data.slow_moving.length === 0 && (
                                                <p className="text-center py-6 text-[10px] font-bold text-slate-400">Everything is selling well.</p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
};

export default InventoryReportsPage;
