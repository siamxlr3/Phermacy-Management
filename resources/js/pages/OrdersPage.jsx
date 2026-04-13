import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import PurchaseOrderTable from '../components/Purchases/PurchaseOrderTable';
import { motion } from 'framer-motion';

const OrdersPage = () => {
  return (
    <DashboardLayout>
      <motion.div 
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        className="h-full flex flex-col min-h-0"
      >
        <div className="shrink-0 mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Purchase Orders</h1>
            <p className="text-slate-400 text-sm font-medium mt-1">Track inventory procurement, supplier deliveries, and purchasing history.</p>
          </div>
        </div>
        
        <div className="flex-1 min-h-0">
          <PurchaseOrderTable />
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default OrdersPage;
