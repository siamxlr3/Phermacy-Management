import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import MedicineTable from '../components/Medicines/MedicineTable';
import { useLanguage } from '../language/GlobalTranslate.jsx';

const MedicinePage = () => {
    const { translations } = useLanguage();
    return (
        <DashboardLayout noScroll>
            {/* Header Section */}
            <div className="shrink-0 mb-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{translations.medicine.inventory_title}</h1>
                    <p className="text-slate-500 text-sm mt-1">{translations.medicine.inventory_subtitle}</p>
                </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 min-h-0 bg-transparent flex flex-col pb-8">
                <MedicineTable />
            </div>
        </DashboardLayout>
    );
};

export default MedicinePage;
