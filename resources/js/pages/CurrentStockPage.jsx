import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Package, Plus } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import BatchListTable from '../components/Stock/BatchListTable';
import GRNTable from '../components/GRN/GRNTable';
import GRNForm from '../components/GRN/GRNForm';

const CurrentStockPage = () => {
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' or 'grn'
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGRN, setEditingGRN] = useState(null);

  const handleAddGRN = () => {
    setEditingGRN(null);
    setIsFormOpen(true);
  };

  const handleEditGRN = (grn) => {
    setEditingGRN(grn);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setTimeout(() => setEditingGRN(null), 300);
  };

  return (
    <DashboardLayout noScroll>
      <Toaster position="top-right" />

      <div className="flex flex-col h-full min-h-0">
        {/* Page Header */}
        <div className="shrink-0 mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                {activeTab === 'stock' ? <Database size={16} className="text-blue-600" /> : <Package size={16} className="text-blue-600" />}
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {activeTab === 'stock' ? 'Inventory Levels' : 'Goods Receiving (GRN)'}
              </h1>
            </div>
            <p className="text-sm text-slate-500 ml-11">
              {activeTab === 'stock' 
                ? 'Track batch numbers, expiry dates, and accurate stock levels.' 
                : 'Receive inventory against purchase orders and track shipments.'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('stock')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'stock' 
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Current Stock
            </button>
            <button
              onClick={() => setActiveTab('grn')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'grn' 
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Receiving (GRN)
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'stock' ? (
              <motion.div
                key="stock-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full"
              >
                <BatchListTable onAdd={handleAddGRN} />
              </motion.div>
            ) : (
              <motion.div
                key="grn-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full"
              >
                <GRNTable onEdit={handleEditGRN} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* GRN Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[60] flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl"
            >
              <GRNForm mode="GRN" grn={editingGRN} onClose={handleCloseForm} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default CurrentStockPage;
