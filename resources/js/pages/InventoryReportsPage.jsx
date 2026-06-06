import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
    RefreshCw,
    Database,
    Clock,
    AlertTriangle,
    CreditCard,
    Package,
    Calendar,
} from 'lucide-react';
import { useGetInventoryReportQuery, useRefreshInventoryReportsMutation } from '../store/api/inventoryReportsApi';
import { useGetAlertSummaryQuery } from '../store/api/alertsApi';
import StockValuationCards from '../components/Reports/StockValuationCards';
import ExpiryRiskTable from '../components/Reports/ExpiryRiskTable';
import SupplierDebtList from '../components/Reports/SupplierDebtList';
import LowStockTable from '../components/Reports/LowStockTable';
import { Toaster, toast } from 'react-hot-toast';
import { useLanguage } from '../language/GlobalTranslate.jsx';
import { cn } from '../lib/utils';

const InventoryReportsPage = () => {
    const { translations } = useLanguage();
    const [activeTab, setActiveTab] = useState('alerts');

    // Default date range: 2026-05-06 to 2026-06-05
    const [dateRange, setDateRange] = useState({
        from_date: '2026-05-06',
        to_date: '2026-06-05',
    });

    const { data: reportData, isLoading, isFetching } = useGetInventoryReportQuery(dateRange);
    const [refreshReports, { isLoading: isRefreshing }] = useRefreshInventoryReportsMutation();

    const { data: alertSummary } = useGetAlertSummaryQuery();

    const handleRefresh = async () => {
        try {
            await refreshReports().unwrap();
            toast.success(translations.reports.analytics_refreshed);
        } catch {
            toast.error(translations.reports.refresh_failed);
        }
    };



    const tabs = [
        { id: 'alerts', label: translations.reports.low_stock_items,        icon: AlertTriangle, iconBg: 'bg-rose-50',   iconText: 'text-rose-600'   },
        { id: 'expiry', label: translations.reports.expiring_soon_expired,   icon: Clock,         iconBg: 'bg-amber-50',  iconText: 'text-amber-600'  },
        { id: 'debts',  label: translations.reports.unpaid_supplier_bills,   icon: CreditCard,    iconBg: 'bg-indigo-50', iconText: 'text-indigo-600' },
    ];

    const activeTabMeta = tabs.find(t => t.id === activeTab);
    const ActiveIcon = activeTabMeta?.icon;

    const panelDesc = {
        alerts: translations.reports.alerts_desc,
        expiry: translations.reports.expiry_desc,
        debts:  translations.reports.debts_desc,
    };

    return (
        <DashboardLayout noScroll>
            <Toaster position="top-right" />
            <div className="flex flex-col h-full min-h-0 bg-slate-50/50 -m-6 p-6">

                {/* Header */}
                <div className="shrink-0 mb-6 flex items-end justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                            <Database size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                                {translations.reports.inventory_analytics}
                            </h1>
                            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest mt-0.5">
                                <Package size={12} className="text-indigo-500" />
                                {translations.reports.sync_data}
                            </p>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3">
                        {/* Date Range Picker */}
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
                            <Calendar size={16} className="text-slate-400 shrink-0" />
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={dateRange.from_date}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, from_date: e.target.value }))}
                                    className="bg-transparent border-none outline-none text-xs font-black text-slate-600"
                                />
                                <span className="text-slate-300 font-bold text-[10px] uppercase">to</span>
                                <input
                                    type="date"
                                    value={dateRange.to_date}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, to_date: e.target.value }))}
                                    className="bg-transparent border-none outline-none text-xs font-black text-slate-600"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                            title={translations.reports.sync_data}
                        >
                            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>



                {/* Summary Cards */}
                <div className="shrink-0 mb-6">
                    <StockValuationCards
                        summaries={reportData?.data.summaries}
                        alertSummary={alertSummary?.data}
                        isLoading={isLoading || isFetching}
                    />
                </div>

                {/* Tab Navigation */}
                <div className="shrink-0 mb-4 flex items-center gap-2">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200',
                                    isActive
                                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                                        : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 shadow-sm'
                                )}
                            >
                                <tab.icon size={13} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Main Content Panel */}
                <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.25 }}
                            className="flex-1 h-full min-h-0 flex flex-col"
                        >
                            {/* Panel Header */}
                            <div className="shrink-0 px-6 py-4 border-b border-slate-100 flex items-center gap-4">
                                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border border-slate-100', activeTabMeta?.iconBg, activeTabMeta?.iconText)}>
                                    {ActiveIcon && <ActiveIcon size={20} />}
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                                        {activeTabMeta?.label}
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                        {panelDesc[activeTab]}
                                    </p>
                                </div>
                            </div>

                            {/* Table Content */}
                            <div className="flex-1 min-h-0 overflow-hidden">
                                {activeTab === 'alerts' && <LowStockTable items={reportData?.data.low_stock || []} isLoading={isLoading || isFetching} />}
                                {activeTab === 'expiry' && <ExpiryRiskTable risks={reportData?.data.expiry_risks?.warning} isLoading={isLoading || isFetching} />}
                                {activeTab === 'debts'  && <SupplierDebtList dues={reportData?.data.dues} isLoading={isLoading || isFetching} />}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default InventoryReportsPage;
