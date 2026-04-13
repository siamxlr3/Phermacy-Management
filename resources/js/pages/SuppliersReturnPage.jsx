import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, History } from 'lucide-react';
import ReturnTable from '../components/Adjustments/ReturnTable';
import ReturnForm from '../components/Adjustments/ReturnForm';
import { Toaster } from 'react-hot-toast';

const SuppliersReturnPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAdjustment, setEditingAdjustment] = useState(null);

  const handleAdd = () => {
    setEditingAdjustment(null);
    setIsFormOpen(true);
  };

  const handleEdit = (adjustment) => {
    setEditingAdjustment(adjustment);
    setIsFormOpen(true);
  };

  const handleClose = () => {
    setIsFormOpen(false);
    setTimeout(() => setEditingAdjustment(null), 300);
  };

  return (
    <DashboardLayout noScroll>
      <Toaster position="top-right" />
      
      <div className="flex flex-col h-full min-h-0 px-2 lg:px-0">
        {/* Page Header */}
        <div className="shrink-0 mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <RotateCcw size={16} className="text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Supplier Returns</h1>
            </div>
            <p className="text-sm text-slate-500 ml-11">Track, manage and record stock adjustments and supplier returns.</p>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0">
          <ReturnTable onAdd={handleAdd} onEdit={handleEdit} />
        </div>
      </div>

      {/* Return Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[4px] z-[70] flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl"
            >
              <ReturnForm adjustment={editingAdjustment} onClose={handleClose} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default SuppliersReturnPage;
