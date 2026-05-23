import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, History, RotateCcw, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { toast, Toaster } from 'react-hot-toast';
import { 
    useGetStockAdjustmentsQuery, 
    useCreateStockAdjustmentMutation, 
    useDeleteStockAdjustmentMutation 
} from '../store/api/stockAdjustmentsApi';
import { useLanguage } from '../language/GlobalTranslate';
import StockAdjustmentTable from '../components/StockAdjustments/StockAdjustmentTable';
import StockAdjustmentForm from '../components/StockAdjustments/StockAdjustmentForm';

const Stock_AdjustmentsPage = () => {
    const { language, translations } = useLanguage();
    const t = translations.stock_adjustments;

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [dateRange, setDateRange] = useState({
        from: '',
        to: format(new Date(), 'yyyy-MM-dd')
    });

    const { data: adjustmentsData, isLoading, isFetching } = useGetStockAdjustmentsQuery({
        page,
        per_page: perPage,
        search: searchTerm,
        adjustment_type: typeFilter,
        from_date: dateRange.from,
        to_date: dateRange.to
    });

    const [createAdjustment, { isLoading: isCreating }] = useCreateStockAdjustmentMutation();
    const [deleteAdjustment] = useDeleteStockAdjustmentMutation();

    const handleCreateAdjustment = async (formData) => {
        try {
            await createAdjustment(formData).unwrap();
            toast.success(t.form.success_msg);
            setIsFormOpen(false);
        } catch (err) {
            toast.error(err.data?.message || t.form.error_msg);
        }
    };

    const handleDeleteAdjustment = async (id) => {
        if (!confirm(t.table.delete_confirm)) return;
        try {
            await deleteAdjustment(id).unwrap();
            toast.success(t.form.delete_success);
        } catch (err) {
            toast.error(t.form.delete_error);
        }
    };

    const adjustments = adjustmentsData?.data || [];
    const meta = adjustmentsData?.meta || {};

    return (
        <DashboardLayout noScroll>
            <Toaster position="top-right" />
            
            <div className="flex flex-col h-full min-h-0 bg-slate-50/50 -m-6 p-6">
                {/* Header */}
                <div className="shrink-0 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                                <RotateCcw size={16} className="text-indigo-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight transition-all duration-300 uppercase">{t.title}</h1>
                        </div>
                        <p className="text-sm text-slate-500 ml-11">{t.subtitle}</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsFormOpen(true)}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-black hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all uppercase tracking-widest"
                        >
                            <Plus size={18} />
                            {t.new_adjustment}
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-h-0 relative">
                    <StockAdjustmentTable 
                        adjustments={adjustments}
                        isLoading={isLoading || isFetching}
                        meta={meta}
                        page={page}
                        setPage={setPage}
                        perPage={perPage}
                        setPerPage={setPerPage}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        typeFilter={typeFilter}
                        setTypeFilter={setTypeFilter}
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                        onDelete={handleDeleteAdjustment}
                    />

                    {/* Modal Overlay for Form */}
                    <AnimatePresence>
                        {isFormOpen && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
                            >
                                <div className="w-full max-w-3xl">
                                    <StockAdjustmentForm 
                                        onSubmit={handleCreateAdjustment}
                                        onCancel={() => setIsFormOpen(false)}
                                        isSubmitting={isCreating}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Stock_AdjustmentsPage;
