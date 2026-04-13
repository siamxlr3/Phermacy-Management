import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import MedicineTable from '../components/Medicines/MedicineTable';
import CategoryTable from '../components/Medicines/CategoryTable';
import ManufacturerTable from '../components/Medicines/ManufacturerTable';

const MedicinePage = () => {
    const [activeTab, setActiveTab] = useState('medicines');

    const tabs = [
        { id: 'medicines', label: 'Medicines' },
        { id: 'categories', label: 'Categories' },
        { id: 'manufacturers', label: 'Manufacturers' }
    ];

    return (
        <DashboardLayout noScroll>
            {/* Header Section */}
            <div className="shrink-0 mb-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pharmacy Inventory</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage medicines, categories, and manufacturing partners</p>
                </div>

                <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60 max-w-max">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ease-out whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'bg-white text-emerald-600 shadow-sm border border-slate-200/50'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Section - Flex-1 wrapper to let children handle scrolling */}
            <div className="flex-1 min-h-0 bg-transparent flex flex-col pb-8">
                {activeTab === 'medicines' && <MedicineTable />}
                {activeTab === 'categories' && <CategoryTable />}
                {activeTab === 'manufacturers' && <ManufacturerTable />}
            </div>
        </DashboardLayout>
    );
};

export default MedicinePage;
