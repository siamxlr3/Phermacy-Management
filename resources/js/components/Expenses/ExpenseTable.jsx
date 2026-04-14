import React, { useState, useEffect } from 'react';
import { Edit2, Search, Trash2, Calendar, Filter, ChevronLeft, ChevronRight, Receipt, User, Phone, MapPin, Eye, EyeOff, Package, Hash } from 'lucide-react';
import { useDeleteExpenseMutation } from '../../store/api/expenseApi';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const ExpenseTable = ({ data, isLoading, page, setPage, perPage, setPerPage, onEdit, filters }) => {
    const [deleteExpense, { isLoading: isDeleting }] = useDeleteExpenseMutation();
    const [expandedRow, setExpandedRow] = useState(null);

    const toggleRow = (id) => setExpandedRow(prev => prev === id ? null : id);

    const {
        searchInput,
        setSearchInput,
        status,
        setStatus,
        dateRange,
        setDateRange,
        handleClearFilters
    } = filters;

    const handleDelete = async (id) => {
        try {
            await deleteExpense(id).unwrap();
            toast.success('Expense record deleted');
        } catch (error) {
            toast.error(error.data?.message || 'Failed to delete record');
        }
    };

    const expenses = data?.data || [];
    const meta = data?.meta || {};

    return (
        <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-0">
            {/* Filters Row */}
            <div className="shrink-0 p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-6 bg-slate-50/30">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 sm:flex-initial min-w-[240px]">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Supplier or Transaction ID..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-400 font-medium"
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                        <Calendar size={14} className="text-slate-400" />
                        <input 
                            type="date"
                            value={dateRange.from_date}
                            onChange={(e) => setDateRange(prev => ({...prev, from_date: e.target.value}))}
                            className="bg-transparent border-none text-[11px] font-bold text-slate-600 outline-none w-[105px]"
                        />
                        <span className="text-slate-300 text-[10px] font-black tracking-widest px-1">TO</span>
                        <input 
                            type="date"
                            value={dateRange.to_date}
                            onChange={(e) => setDateRange(prev => ({...prev, to_date: e.target.value}))}
                            className="bg-transparent border-none text-[11px] font-bold text-slate-600 outline-none w-[105px]"
                        />
                    </div>

                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                        {[['', 'All'], ['Paid', 'Paid'], ['Unpaid', 'Unpaid']].map(([val, lbl]) => (
                            <button
                                key={val}
                                onClick={() => setStatus(val)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                    status === val
                                        ? 'bg-slate-900 text-white shadow-md'
                                        : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {lbl}
                            </button>
                        ))}
                    </div>

                    {(searchInput || status || dateRange.from_date || dateRange.to_date) && (
                        <button 
                            onClick={handleClearFilters}
                            className="text-[10px] font-black text-rose-500 hover:text-rose-700 uppercase tracking-widest px-2 transition-colors"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-x-auto min-h-0 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Trace ID & Date</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Supplier Details</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Phone</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Address</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Items</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Grand Total</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Payment</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right pr-6">Actions</th>
                            <th className="w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-md w-24"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-md w-40"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-md w-28"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-md w-36"></div></td>
                                    <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-100 rounded-md w-12 mx-auto"></div></td>
                                    <td className="px-6 py-4 text-right"><div className="h-4 bg-slate-100 rounded-md w-20 ml-auto"></div></td>
                                    <td className="px-6 py-4 text-center"><div className="h-6 bg-slate-100 rounded-full w-16 mx-auto"></div></td>
                                    <td className="px-6 py-4 text-right pr-6"><div className="h-8 bg-slate-100 rounded-lg w-16 ml-auto"></div></td>
                                </tr>
                            ))
                        ) : expenses.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                                            <Receipt size={24} className="text-slate-300" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">No expense reports found</p>
                                        <p className="text-xs text-slate-400 mt-1">Try adjusted filters or add a new entry.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            expenses.map((expense) => {
                                const isExpanded = expandedRow === expense.id;
                                return (
                                    <React.Fragment key={expense.id}>
                                        <tr
                                            className={`group transition-all duration-150 cursor-pointer ${
                                                isExpanded ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'
                                            }`}
                                            onClick={() => toggleRow(expense.id)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-indigo-600 tracking-tight">{expense.transaction_id}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{expense.expense_date}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-sm font-bold text-slate-700">{expense.supplier_name}</span>
                                                    <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                                                        <User size={10} className="text-slate-300" />
                                                        <span>{expense.contact_person || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Phone size={11} className="text-slate-300 shrink-0" />
                                                    <span className="text-sm font-medium text-slate-600">{expense.phone || '—'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 max-w-[180px]">
                                                <div className="flex items-start gap-2">
                                                    <MapPin size={11} className="text-slate-300 shrink-0 mt-0.5" />
                                                    <span className="text-sm font-medium text-slate-600 truncate" title={expense.address || ''}>{expense.address || '—'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-xs font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                    {expense.items?.length || 0} Items
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-black text-slate-900 tracking-tight">৳{Number(expense.grand_total).toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                                                    expense.status === 'Paid'
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                        : 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse'
                                                }`}>
                                                    {expense.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button
                                                        onClick={() => onEdit(expense)}
                                                        className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors shadow-sm"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={15} />
                                                    </button>

                                                    <button
                                                        onClick={() => handleDelete(expense.id)}
                                                        disabled={isDeleting}
                                                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="w-10 text-center pr-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleRow(expense.id); }}
                                                    className={`p-1.5 rounded-lg transition-colors ${
                                                        isExpanded
                                                            ? 'text-indigo-600 bg-indigo-100'
                                                            : 'text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 opacity-0 group-hover:opacity-100'
                                                    }`}
                                                    title="View Items"
                                                >
                                                    {isExpanded ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                            </td>
                                        </tr>

                                        {/* Expandable Items Sub-Row */}
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan="7" className="p-0 border-b border-indigo-100">
                                                    <div className="bg-indigo-50/40 px-8 py-4">
                                                        {expense.items && expense.items.length > 0 ? (
                                                            <>
                                                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                                    <Package size={11} />
                                                                    Expense Line Items — {expense.items.length} record{expense.items.length !== 1 ? 's' : ''}
                                                                </p>
                                                                <div className="bg-white rounded-xl border border-indigo-100 overflow-hidden shadow-sm">
                                                                    <table className="w-full text-left">
                                                                        <thead className="bg-slate-50 border-b border-slate-100">
                                                                            <tr>
                                                                                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Item Description</th>
                                                                                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                                                                                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Qty</th>
                                                                                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Unit Price</th>
                                                                                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Amount</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-slate-50">
                                                                            {expense.items.map((item, idx) => (
                                                                                <tr key={item.id || idx} className="hover:bg-slate-50/60 transition-colors">
                                                                                    <td className="px-4 py-2.5">
                                                                                        <span className="text-sm font-semibold text-slate-700">{item.items_name}</span>
                                                                                    </td>
                                                                                    <td className="px-4 py-2.5">
                                                                                        <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{item.category}</span>
                                                                                    </td>
                                                                                    <td className="px-4 py-2.5 text-center">
                                                                                        <span className="text-sm font-bold text-slate-600">{item.qty}</span>
                                                                                    </td>
                                                                                    <td className="px-4 py-2.5 text-right">
                                                                                        <span className="text-sm font-semibold text-slate-500">৳{Number(item.price).toLocaleString()}</span>
                                                                                    </td>
                                                                                    <td className="px-4 py-2.5 text-right">
                                                                                        <span className="text-sm font-black text-slate-900">৳{Number(item.total_price).toLocaleString()}</span>
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                        <tfoot className="bg-slate-50 border-t border-slate-200">
                                                                            <tr>
                                                                                <td colSpan="5" className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Grand Total</td>
                                                                                <td className="px-4 py-2.5 text-right">
                                                                                    <span className="text-sm font-black text-indigo-600">৳{Number(expense.grand_total).toLocaleString()}</span>
                                                                                </td>
                                                                            </tr>
                                                                        </tfoot>
                                                                    </table>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="flex items-center gap-3 py-2 text-slate-400">
                                                                <Package size={16} className="text-slate-300" />
                                                                <span className="text-sm font-medium">No line items recorded for this expense.</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Rows per page:</span>
                    <select
                        value={perPage}
                        onChange={(e) => {
                            setPerPage(Number(e.target.value));
                            setPage(1);
                        }}
                        className="bg-white border border-slate-200 text-xs font-bold text-slate-600 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 cursor-pointer shadow-sm shadow-indigo-100/20"
                    >
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                    </select>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 px-3 py-1.5 bg-white rounded-lg border border-slate-200 shadow-sm shadow-indigo-100/20">
                        Page <span className="text-indigo-600">{meta.current_page || 1}</span> of <span className="text-indigo-600">{meta.last_page || 1}</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                            className="p-2 ml-4 rounded-xl border border-slate-200 hover:bg-white text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm shadow-indigo-100/20"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => setPage(page + 1)}
                            disabled={page >= (meta.last_page || 1)}
                            className="p-2 rounded-xl border border-slate-200 hover:bg-white text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm shadow-indigo-100/20"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExpenseTable;
