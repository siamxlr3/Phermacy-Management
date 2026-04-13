import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, MapPin, Settings2 } from 'lucide-react';
import TaxTable from '../components/Settings/TaxTable';
import AddressTable from '../components/Settings/AddressTable';
import { Toaster } from 'react-hot-toast';

const tabs = [
  { id: 'taxes', label: 'Tax Configuration', icon: Receipt },
  { id: 'addresses', label: 'Branch Addresses', icon: MapPin },
];

const SettingPage = () => {
  const [activeTab, setActiveTab] = useState('taxes');

  return (
    <DashboardLayout noScroll>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { fontFamily: 'inherit', fontSize: '14px', fontWeight: 500 },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
        }}
      />

      {/* Full-height flex layout — nothing scrolls at page level */}
      <div className="flex flex-col h-full min-h-0">

        {/* Page Header — fixed, never scrolls */}
        <div className="shrink-0 mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Settings2 size={16} className="text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1>
          </div>
          <p className="text-sm text-slate-500 ml-11">Manage your pharmacy's tax policies and branch information.</p>
        </div>

        {/* Tab Navigation — fixed, never scrolls */}
        <div className="shrink-0 mb-5">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-sm shadow-slate-200'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icon size={15} className={isActive ? 'text-emerald-600' : 'text-slate-400'} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content area — fills remaining height, table scrolls internally */}
        <div className="flex-1 min-h-0">
          <AnimatePresence mode="wait">
            {activeTab === 'taxes' && (
              <motion.div
                key="taxes"
                className="h-full"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <TaxTable />
              </motion.div>
            )}
            {activeTab === 'addresses' && (
              <motion.div
                key="addresses"
                className="h-full"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <AddressTable />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingPage;
