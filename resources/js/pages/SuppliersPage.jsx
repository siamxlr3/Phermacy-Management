import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import SupplierTable from '../components/Suppliers/SupplierTable';
import { motion } from 'framer-motion';

const SuppliersPage = () => {
  return (
    <DashboardLayout>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full flex flex-col min-h-0"
      >
        <div className="shrink-0 mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Supplier Management</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your pharmaceutical vendors, contact terms, and partner relationships.</p>
        </div>
        
        <div className="flex-1 min-h-0">
          <SupplierTable />
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default SuppliersPage;
