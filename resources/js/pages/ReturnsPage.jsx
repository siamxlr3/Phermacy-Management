import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, History, Settings2, ShoppingBag } from 'lucide-react';
import ReturnsTable from '../components/Returns/ReturnsTable';
import ReturnForm from '../components/Returns/ReturnForm';
import { Toaster } from 'react-hot-toast';

const tabs = [
    { id: 'history', label: 'Refund History', icon: History },
    { id: 'new', label: 'New Sale Return', icon: RotateCcw },
];

const ReturnsPage = () => {
    const [activeTab, setActiveTab] = useState('history');

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
                
                {/* Fixed Header */}
                <div className="shrink-0 mb-6 flex flex-col gap-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200">
                                <RotateCcw size={24} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Returns & Refunds</h1>
                                <p className="text-sm font-bold text-slate-400 flex items-center gap-2">
                                    Manage customer returns and inventory re-crediting
                                </p>
                            </div>
                        </div>

                        {/* Tab Switcher */}
                        <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-2xl shadow-sm">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all duration-300 ${
                                            isActive
                                                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                        }`}
                                    >
                                        <Icon size={14} className={isActive ? 'text-rose-400' : 'text-slate-400'} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 min-h-0">
                    <AnimatePresence mode="wait">
                        {activeTab === 'history' && (
                            <motion.div
                                key="history"
                                className="h-full"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                            >
                                <ReturnsTable />
                            </motion.div>
                        )}
                        {activeTab === 'new' && (
                            <motion.div
                                key="new"
                                className="h-full"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                            >
                                <ReturnForm onComplete={() => setActiveTab('history')} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ReturnsPage;
