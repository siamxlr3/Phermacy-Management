import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { Database } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import BatchListTable from '../components/Stock/BatchListTable';

const CurrentStockPage = () => {
  return (
    <DashboardLayout noScroll>
      <Toaster position="top-right" />

      <div className="flex flex-col h-full min-h-0">
        {/* Page Header */}
        <div className="shrink-0 mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Database size={16} className="text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Precision Inventory</h1>
          </div>
          <p className="text-sm text-slate-500 ml-11">Detailed tracking of medicine IDs, batch numbers, and accurate stock levels.</p>
        </div>

        {/* Content area */}
        <div className="flex-1 min-h-0">
          <BatchListTable />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CurrentStockPage;
