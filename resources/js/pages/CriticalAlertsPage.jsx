import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { motion } from 'framer-motion';
import { AlertTriangle, ShieldCheck, Zap, Cog, Bell } from 'lucide-react';
import { useRunProcessMutation, useGetAlertSummaryQuery } from '../store/api/alertsApi';
import AlertTable from '../components/Alerts/AlertTable';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';

const CriticalAlertsPage = () => {
    const [runProcess, { isLoading: isRunning }] = useRunProcessMutation();
    const { data: summary } = useGetAlertSummaryQuery();

    const handleRunScan = async () => {
        try {
            const res = await runProcess().unwrap();
            toast.success(`Scan completed: Found ${res.data.expiry_alerts} expiry alerts.`);
        } catch (err) {
            toast.error('Failed to run inventory scan');
        }
    };

    return (
        <DashboardLayout noScroll>
             <Toaster
                position="top-right"
                toastOptions={{
                    style: { fontFamily: 'inherit', fontSize: '14px', fontWeight: 500 },
                    success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
                }}
            />
            
            <div className="flex flex-col h-full min-h-0 bg-slate-50/50 -m-6 p-6">
                
                {/* Page Header */}
                <div className="shrink-0 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center relative">
                                <Bell size={16} className="text-rose-600" />
                                {summary?.count > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-slate-900 text-white rounded-full flex items-center justify-center text-[8px] font-black border border-white">
                                        {summary.count}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Critical Alerts</h1>
                        </div>
                        <p className="text-sm text-slate-500 ml-11">Real-time inventory monitoring & expiry protection</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleRunScan}
                            disabled={isRunning}
                            className="group flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 hover:border-blue-400 rounded-2xl text-xs font-black text-slate-600 hover:text-blue-600 transition-all shadow-sm hover:shadow-lg hover:shadow-blue-500/10 active:scale-95 disabled:opacity-50"
                        >
                            <Zap size={16} className={isRunning ? 'animate-pulse text-blue-500' : 'text-slate-400 group-hover:text-blue-500'} />
                            {isRunning ? 'Scanning Inventory...' : 'Run Full System Scan'}
                        </button>
                        
                        <div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 cursor-pointer transition-all shadow-sm">
                            <Cog size={20} />
                        </div>
                    </div>
                </div>

                {/* KPI Overview Row */}
                <div className="shrink-0 grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[
                        { label: 'Active Alerts', value: summary?.count || 0, color: 'rose', icon: Bell },
                        { label: 'Stock Threats', value: 'Monitoring', color: 'amber', icon: AlertTriangle },
                        { label: 'Expiry Guard', value: 'Active', color: 'blue', icon: ShieldCheck },
                    ].map((kpi, idx) => {
                        const Icon = kpi.icon;
                        return (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm flex items-center gap-5"
                            >
                                <div className={`w-12 h-12 rounded-2xl bg-${kpi.color}-50 flex items-center justify-center text-${kpi.color}-600 shadow-inner`}>
                                    <Icon size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                                    <p className="text-xl font-black text-slate-900">{kpi.value}</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Main Alerts Table Area */}
                <div className="flex-1 min-h-0">
                    <AlertTable />
                </div>
            </div>
        </DashboardLayout>
    );
};

export default CriticalAlertsPage;
