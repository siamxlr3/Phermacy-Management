import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Package } from 'lucide-react';
import GRNTable from '../components/GRN/GRNTable';
import GRNForm from '../components/GRN/GRNForm';
import { Toaster } from 'react-hot-toast';

const GRNPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGRN, setEditingGRN] = useState(null);

  const handleAdd = () => {
    setEditingGRN(null);
    setIsFormOpen(true);
  };

  const handleEdit = (grn) => {
    setEditingGRN(grn);
    setIsFormOpen(true);
  };

  const handleClose = () => {
    setIsFormOpen(false);
    setTimeout(() => setEditingGRN(null), 300);
  };

  return (
    <DashboardLayout noScroll>
      <Toaster position="top-right" />
      
      <div className="flex flex-col h-full min-h-0">
        {/* Page Header */}
        <div className="shrink-0 mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Package size={16} className="text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Goods Receiving (GRN)</h1>
            </div>
            <p className="text-sm text-slate-500 ml-11">Receive inventory against purchase orders and track batch numbers.</p>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0">
          <GRNTable onAdd={handleAdd} onEdit={handleEdit} />
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
              <GRNForm grn={editingGRN} onClose={handleClose} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default GRNPage;
