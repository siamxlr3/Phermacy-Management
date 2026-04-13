import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, DollarSign, Wallet, CheckCircle, XCircle, Search, Calendar, Filter, Plus } from 'lucide-react';
import { useGetExpensesQuery, useGetExpenseSummaryQuery } from '../store/api/expenseApi';
import ExpenseTable from '../components/Expenses/ExpenseTable';
import ExpenseForm from '../components/Expenses/ExpenseForm';
import { Toaster, toast } from 'react-hot-toast';

const ExpensePage = () => {
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [dateRange, setDateRange] = useState({ from_date: '', to_date: '' });
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);

    const { data: expensesData, isLoading, isFetching } = useGetExpensesQuery({
        page,
        per_page: perPage,
        search,
        status,
        from_date: dateRange.from_date,
        to_date: dateRange.to_date
    });

    const { data: summaryData, isLoading: isSummaryLoading } = useGetExpenseSummaryQuery();
    
    // Debounce search input logic...
    const [searchInput, setSearchInput] = useState('');
    React.useEffect(() => {
        const timeout = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 500);
        return () => clearTimeout(timeout);
    }, [searchInput]);

    const handleClearFilters = () => {
        setSearchInput('');
        setStatus('');
        setDateRange({ from_date: '', to_date: '' });
        setPage(1);
    };

    const handleEdit = (expense) => {
        setEditingExpense(expense);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setTimeout(() => setEditingExpense(null), 300);
    };

    const summaryCards = [
        {
            label: 'Total Expenses',
            value: `৳${Number(summaryData?.data?.total_expenses || 0).toLocaleString()}`,
            icon: Receipt,
            color: 'indigo'
        },
        {
            label: 'Total Paid',
            value: `৳${Number(summaryData?.data?.total_paid || 0).toLocaleString()}`,
            icon: CheckCircle,
            color: 'emerald'
        },
        {
            label: 'Total Unpaid',
            value: `৳${Number(summaryData?.data?.total_unpaid || 0).toLocaleString()}`,
            icon: XCircle,
            color: 'rose'
        }
    ];

    return (
        <DashboardLayout noScroll>
            <Toaster position="top-right" />
            
            <div className="flex flex-col h-full min-h-0">
                
                {/* Header */}
                <div className="shrink-0 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                                <Wallet size={16} className="text-indigo-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Expense Management</h1>
                        </div>
                        <p className="text-sm text-slate-500 ml-11">Track & manage your business expenditures.</p>
                    </div>

                    <button 
                        onClick={() => setIsFormOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 transition-all w-full md:w-auto justify-center"
                    >
                        <Plus size={18} />
                        New Expense
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="shrink-0 grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {summaryCards.map((card, idx) => {
                        const Icon = card.icon;
                        return (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all"
                            >
                                <div className={`w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-${card.color}-600 border border-slate-100`}>
                                    <Icon size={24} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
                                    {isSummaryLoading ? (
                                        <div className="h-6 w-24 bg-slate-100 rounded-md animate-pulse mt-1" />
                                    ) : (
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">{card.value}</h3>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Table Area */}
                <div className="flex-1 min-h-0">
                    <ExpenseTable 
                        data={expensesData} 
                        isLoading={isLoading || isFetching} 
                        page={page}
                        setPage={setPage}
                        perPage={perPage}
                        setPerPage={setPerPage}
                        onEdit={handleEdit}
                        filters={{
                            searchInput,
                            setSearchInput,
                            status,
                            setStatus,
                            dateRange,
                            setDateRange,
                            handleClearFilters
                        }}
                    />
                </div>
            </div>

            {/* Expense Form Modal */}
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
                            <ExpenseForm 
                                onClose={handleCloseForm} 
                                expense={editingExpense} 
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

export default ExpensePage;
