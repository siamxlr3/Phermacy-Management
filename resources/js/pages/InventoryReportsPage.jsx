import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar, 
    RefreshCw, 
    Database, 
    Bell,
    Zap,
    Clock,
    AlertTriangle,
    ShieldCheck,
    CreditCard,
    Package
} from 'lucide-react';
import { useGetInventoryReportQuery, useRefreshInventoryReportsMutation } from '../store/api/inventoryReportsApi';
import { useRunProcessMutation, useGetAlertSummaryQuery } from '../store/api/alertsApi';
import StockValuationCards from '../components/Reports/StockValuationCards';
import ExpiryRiskTable from '../components/Reports/ExpiryRiskTable';
import SupplierDebtList from '../components/Reports/SupplierDebtList';
import LowStockTable from '../components/Reports/LowStockTable';
import { Toaster, toast } from 'react-hot-toast';
import { useLanguage } from '../language/GlobalTranslate.jsx';

const InventoryReportsPage = () => {
    const { translations } = useLanguage();
    const [activeTab, setActiveTab] = useState('alerts'); // alerts, expiry, debts

    const [dateRange, setDateRange] = useState({
        from_date: new Date().toISOString().split('T')[0],
        to_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

    const { data: reportData, isLoading, isFetching } = useGetInventoryReportQuery(dateRange);
    const [refreshReports, { isLoading: isRefreshing }] = useRefreshInventoryReportsMutation();
    const [runProcess, { isLoading: isRunning }] = useRunProcessMutation();
    const { data: alertSummary } = useGetAlertSummaryQuery();

    const handleRefresh = async () => {
        try {
            await refreshReports().unwrap();
            toast.success(translations.reports.analytics_refreshed);
        } catch (err) {
            toast.error(translations.reports.refresh_failed);
        }
    };

    const handleRunScan = async () => {
        try {
            const res = await runProcess().unwrap();
            toast.success(translations.reports.scan_complete.replace('{n}', res.data?.expiry_alerts || 0));
        } catch (err) {
            toast.error(translations.reports.scan_failed);
        }
    };

    const tabs = [
        { id: 'alerts', label: translations.reports.low_stock_items, icon: AlertTriangle, color: 'rose' },
        { id: 'expiry', label: translations.reports.expiring_soon_expired, icon: Clock, color: 'amber' },
        { id: 'debts', label: translations.reports.unpaid_supplier_bills, icon: CreditCard, color: 'indigo' },
    ];

    return (
        <DashboardLayout noScroll>
            <Toaster position="top-right" />
            
            <div className="flex flex-col h-full min-h-0 premium-gradient-bg jakarta-sans -m-6 p-8 overflow-hidden">
                

                {/* Dashboard Header & Refresh */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-black text-[#0f1923] tracking-tight">{translations.reports.inventory_analytics}</h1>
                    <button 
                        onClick={handleRefresh} 
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200/60 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 text-slate-700 font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                        {translations.reports.sync_data}
                    </button>
                </div>

                {/* Dashboard Summary & View Toggles */}
                <div className="shrink-0 space-y-7 mb-7">
                    <StockValuationCards 
                        summaries={reportData?.data.summaries} 
                        alertSummary={alertSummary?.data}
                        isLoading={isLoading || isFetching} 
                    />

                    {/* Tab Navigation */}
                    <div className="flex items-center gap-1.5 p-1.5 premium-glass rounded-2xl shadow-sm w-fit border border-slate-200/40">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            const dotColors = { alerts: 'bg-red-500', expiry: 'bg-amber-500', debts: 'bg-blue-500' };
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl transition-all duration-300 relative ${
                                        isActive 
                                            ? 'bg-[#0f1923] text-white shadow-lg shadow-slate-900/10' 
                                            : 'text-slate-500 hover:bg-black/5 font-bold'
                                    }`}
                                >
                                    {!isActive && <div className={`w-1.5 h-1.5 rounded-full ${dotColors[tab.id]}`} />}
                                    <span className="text-[12px] font-bold uppercase tracking-wide">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 min-h-0 overflow-hidden flex flex-col premium-glass rounded-[20px] shadow-xl border border-slate-200/50">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.3 }}
                            className="flex-1 h-full min-h-0 flex flex-col"
                        >
                            {/* Dynamic Panel Header based on Tab */}
                            <div className="shrink-0 px-6 py-5 border-b border-slate-200/60 bg-white/40 backdrop-blur-sm flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm ${
                                    activeTab === 'alerts' ? 'bg-rose-500/10 text-rose-600' :
                                    activeTab === 'expiry' ? 'bg-amber-500/10 text-amber-600' :
                                    'bg-blue-500/10 text-blue-600'
                                }`}>
                                    {activeTab === 'alerts' ? '⚠️' : activeTab === 'expiry' ? '⏰' : '🧾'}
                                </div>
                                <div>
                                    <h3 className="text-[14px] font-extrabold text-[#0f1923] tracking-tight uppercase">
                                        {tabs.find(t => t.id === activeTab)?.label}
                                    </h3>
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                        {activeTab === 'alerts' ? translations.reports.alerts_desc :
                                         activeTab === 'expiry' ? translations.reports.expiry_desc :
                                         translations.reports.debts_desc}
                                    </p>
                                </div>
                            </div>

                            <div className="flex-1 min-h-0 overflow-hidden">
                                {activeTab === 'alerts' && <LowStockTable items={reportData?.data.low_stock || []} />}
                                {activeTab === 'expiry' && <ExpiryRiskTable risks={reportData?.data.expiry_risks.warning} />}
                                {activeTab === 'debts' && <SupplierDebtList dues={reportData?.data.dues} />}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default InventoryReportsPage;
