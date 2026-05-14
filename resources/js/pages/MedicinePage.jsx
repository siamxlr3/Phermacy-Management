import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import MedicineTable from '../components/Medicines/MedicineTable';
import { motion } from 'framer-motion';
import { useLanguage } from '../language/GlobalTranslate.jsx';

const MedicinePage = () => {
    const { translations } = useLanguage();

    return (
        <DashboardLayout noScroll>
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full flex flex-col min-h-0 w-full min-w-0 overflow-hidden"
            >
                <div className="shrink-0 mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{translations.medicine?.inventory_title || 'Medicine Inventory'}</h1>
                    <p className="text-slate-500 text-sm mt-1">{translations.medicine?.inventory_subtitle || 'Manage pharmacy products and perform bulk operations'}</p>
                </div>

                <div className="flex-1 min-h-0 min-w-0 w-full overflow-hidden">
                    <MedicineTable />
                </div>
            </motion.div>
        </DashboardLayout>
    );
};

export default MedicinePage;
