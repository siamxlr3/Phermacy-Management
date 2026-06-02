import React, { useState } from 'react';
import { Edit2, Search, Trash2, Calendar, ChevronLeft, ChevronRight, Receipt, User, Phone, MapPin, Package } from 'lucide-react';
import { useDeleteExpenseMutation } from '../../store/api/expenseApi';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../../language/GlobalTranslate.jsx';

const ExpenseTable = ({ data, isLoading, page, setPage, perPage, setPerPage, onEdit, filters }) => {
    const { translations } = useLanguage();
    const [deleteExpense, { isLoading: isDeleting }] = useDeleteExpenseMutation();

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
            toast.success(translations.expense.delete_success);
        } catch (error) {
            toast.error(error.data?.message || translations.expense.delete_failed);
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
                            placeholder={translations.expense.search_placeholder}
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
                            onChange={(e) => setDateRange(prev => ({ ...prev, from_date: e.target.value }))}
                            className="bg-transparent border-none text-[11px] font-bold text-slate-600 outline-none w-[105px]"
                        />
                        <span className="text-slate-300 text-[10px] font-black tracking-widest px-1">{translations.pos?.to || 'TO'}</span>
                        <input
                            type="date"
                            value={dateRange.to_date}
                            onChange={(e) => setDateRange(prev => ({ ...prev, to_date: e.target.value }))}
                            className="bg-transparent border-none text-[11px] font-bold text-slate-600 outline-none w-[105px]"
                        />
                    </div>

                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                        {[['', translations.expense.all], ['Paid', translations.expense.paid], ['Unpaid', translations.expense.unpaid]].map(([val, lbl]) => (
                            <button
                                key={val}
                                onClick={() => setStatus(val)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${status === val
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
                            {translations.expense.reset}
                        </button>
                    )}
                </div>
            </div>

            {/* Table Area — horizontal scroll for wide flat columns */}
            <div className="flex-1 overflow-auto min-h-0 custom-scrollbar">
                <table className="w-full text-left border-collapse" style={{ minWidth: '1400px' }}>
                    <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 border-b border-slate-200">
                        <tr>
                            {/* Group 1: Core */}
                            <th className="px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                {translations.expense.trace_id_date}
                            </th>
                            <th className="px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                {translations.expense.supplier_details}
                            </th>
                            <th className="px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                {translations.expense.phone}
                            </th>
                            <th className="px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                {translations.expense.address}
                            </th>

                            {/* Divider */}
                            <th className="px-0 py-3.5 w-px bg-indigo-100/60"></th>

                            {/* Group 2: Items (flat from sub-table) */}
                            <th className="px-4 py-3.5 text-[10px] font-black text-indigo-400 uppercase tracking-widest whitespace-nowrap bg-indigo-50/40">
                                {translations.expense.item_desc}
                            </th>
                            <th className="px-4 py-3.5 text-[10px] font-black text-indigo-400 uppercase tracking-widest whitespace-nowrap bg-indigo-50/40">
                                {translations.expense.type}
                            </th>
                            <th className="px-4 py-3.5 text-[10px] font-black text-indigo-400 uppercase tracking-widest text-center whitespace-nowrap bg-indigo-50/40">
                                {translations.expense.qty}
                            </th>
                            <th className="px-4 py-3.5 text-[10px] font-black text-indigo-400 uppercase tracking-widest text-right whitespace-nowrap bg-indigo-50/40">
                                {translations.expense.unit_price}
                            </th>
                            <th className="px-4 py-3.5 text-[10px] font-black text-indigo-400 uppercase tracking-widest text-right whitespace-nowrap bg-indigo-50/40">
                                {translations.expense.amount}
                            </th>

                            {/* Divider */}
                            <th className="px-0 py-3.5 w-px bg-indigo-100/60"></th>

                            {/* Group 3: Totals & Status */}
                            <th className="px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">
                                {translations.expense.grand_total}
                            </th>
                            <th className="px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">
                                {translations.expense.payment}
                            </th>
                            <th className="px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap pr-5">
                                {translations.expense.actions}
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    {Array.from({ length: 13 }).map((__, j) => (
                                        <td key={j} className={`px-4 py-4 ${j === 5 || j === 9 ? 'px-0 w-px' : ''}`}>
                                            {j !== 5 && j !== 9 && <div className="h-4 bg-slate-100 rounded-md w-20"></div>}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : expenses.length === 0 ? (
                            <tr>
                                <td colSpan="14" className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                                            <Receipt size={24} className="text-slate-300" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">{translations.expense.no_reports}</p>
                                        <p className="text-xs text-slate-400 mt-1">{translations.expense.no_reports_desc}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            expenses.map((expense) => {
                                const items = expense.items || [];

                                // If no items, render a single row with dashes for item columns
                                if (items.length === 0) {
                                    return (
                                        <tr key={expense.id} className="group hover:bg-slate-50/60 transition-all duration-150">
                                            <ExpenseCoreColumns expense={expense} rowSpan={1} />
                                            <td className="px-0 w-px bg-indigo-100/30 border-y border-indigo-100/60"></td>
                                            {/* Item columns — empty */}
                                            <td className="px-4 py-3.5 bg-indigo-50/20">
                                                <span className="text-xs text-slate-300 italic">—</span>
                                            </td>
                                            <td className="px-4 py-3.5 bg-indigo-50/20">
                                                <span className="text-xs text-slate-300 italic">—</span>
                                            </td>
                                            <td className="px-4 py-3.5 text-center bg-indigo-50/20">
                                                <span className="text-xs text-slate-300 italic">—</span>
                                            </td>
                                            <td className="px-4 py-3.5 text-right bg-indigo-50/20">
                                                <span className="text-xs text-slate-300 italic">—</span>
                                            </td>
                                            <td className="px-4 py-3.5 text-right bg-indigo-50/20">
                                                <span className="text-xs text-slate-300 italic">—</span>
                                            </td>
                                            <td className="px-0 w-px bg-indigo-100/30 border-y border-indigo-100/60"></td>
                                            <ExpenseTailColumns expense={expense} isDeleting={isDeleting} onEdit={onEdit} handleDelete={handleDelete} rowSpan={1} translations={translations} />
                                        </tr>
                                    );
                                }

                                // Multi-item: one row per item, rowSpan for core & tail columns on first row
                                return items.map((item, idx) => (
                                    <tr
                                        key={`${expense.id}-${idx}`}
                                        className={`group transition-all duration-150 ${idx === 0 ? 'border-t border-slate-200' : 'border-t border-indigo-50'} hover:bg-indigo-50/20`}
                                    >
                                        {/* Core columns only on first item row */}
                                        {idx === 0 && (
                                            <>
                                                <td className="px-4 py-3.5 align-top" rowSpan={items.length}>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-indigo-600 tracking-tight whitespace-nowrap">{expense.transaction_id}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 whitespace-nowrap">{expense.expense_date}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 align-top" rowSpan={items.length}>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-sm font-bold text-slate-700 whitespace-nowrap">{expense.supplier_name}</span>
                                                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                                                            <User size={10} className="text-slate-300" />
                                                            <span className="whitespace-nowrap">{expense.contact_person || 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 align-top" rowSpan={items.length}>
                                                    <div className="flex items-center gap-1.5">
                                                        <Phone size={11} className="text-slate-300 shrink-0" />
                                                        <span className="text-sm font-medium text-slate-600 whitespace-nowrap">{expense.phone || '—'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 align-top max-w-[160px]" rowSpan={items.length}>
                                                    <div className="flex items-start gap-1.5">
                                                        <MapPin size={11} className="text-slate-300 shrink-0 mt-0.5" />
                                                        <span className="text-sm font-medium text-slate-600 truncate" title={expense.address || ''}>{expense.address || '—'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-0 w-px bg-indigo-100/30" rowSpan={items.length}></td>
                                            </>
                                        )}

                                        {/* Item columns — one per row */}
                                        <td className="px-4 py-3 bg-indigo-50/20">
                                            <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">{item.items_name}</span>
                                        </td>
                                        <td className="px-4 py-3 bg-indigo-50/20">
                                            <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 whitespace-nowrap">{item.category}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center bg-indigo-50/20">
                                            <span className="text-sm font-bold text-slate-600">{item.qty}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right bg-indigo-50/20">
                                            <span className="text-sm font-semibold text-slate-500 whitespace-nowrap">৳{Number(item.price).toLocaleString()}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right bg-indigo-50/20">
                                            <span className="text-sm font-black text-slate-800 whitespace-nowrap">৳{Number(item.total_price).toLocaleString()}</span>
                                        </td>

                                        {/* Divider + tail columns only on first item row */}
                                        {idx === 0 && (
                                            <>
                                                <td className="px-0 w-px bg-indigo-100/30" rowSpan={items.length}></td>
                                                <td className="px-4 py-3.5 text-right align-top" rowSpan={items.length}>
                                                    <span className="text-sm font-black text-slate-900 tracking-tight whitespace-nowrap">৳{Number(expense.grand_total).toLocaleString()}</span>
                                                </td>
                                                <td className="px-4 py-3.5 text-center align-top" rowSpan={items.length}>
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm whitespace-nowrap ${expense.status === 'Paid'
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                        : 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse'
                                                        }`}>
                                                        {expense.status === 'Paid' ? translations.expense.paid : translations.expense.unpaid}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 text-right pr-5 align-top" rowSpan={items.length}>
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
                                            </>
                                        )}
                                    </tr>
                                ));
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{translations.expense.rows_per_page}</span>
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
                        {translations.expense.page_meta
                            .replace('{current}', meta.current_page || 1)
                            .replace('{total}', meta.last_page || 1)}
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
