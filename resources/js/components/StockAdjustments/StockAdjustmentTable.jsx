import React from 'react';
import { Search, Calendar, ChevronLeft, ChevronRight, Trash2, Info, Package, AlertTriangle, Hash, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../language/GlobalTranslate';

const typeStyles = {
    damage: 'bg-rose-50 text-rose-600 border-rose-100 icon-bg-rose-100',
    expired: 'bg-amber-50 text-amber-600 border-amber-100 icon-bg-amber-100',
    opening_balance: 'bg-emerald-50 text-emerald-600 border-emerald-100 icon-bg-emerald-100',
    correction: 'bg-blue-50 text-blue-600 border-blue-100 icon-bg-blue-100',
    theft: 'bg-slate-50 text-slate-600 border-slate-200 icon-bg-slate-100',
    lost: 'bg-orange-50 text-orange-600 border-orange-100 icon-bg-orange-100',
};

const StockAdjustmentTable = ({ 
    adjustments, 
    isLoading, 
    meta, 
    page, 
    setPage, 
    perPage, 
    setPerPage, 
    searchTerm, 
    setSearchTerm, 
    typeFilter, 
    setTypeFilter, 
    dateRange, 
    setDateRange,
    onDelete
}) => {
    const { language, translations } = useLanguage();
    const t = translations.stock_adjustments;

    const handleReset = () => {
        setSearchTerm('');
        setTypeFilter('');
        setDateRange({ from: '', to: format(new Date(), 'yyyy-MM-dd') });
        setPage(1);
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-0">
            {/* Filter Section */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4 flex-1">
                        {/* Search */}
                        <div className="relative min-w-[300px] group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder={t.search_placeholder}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-400 text-slate-600"
                            />
                        </div>

                        {/* Type Filter */}
                        <select 
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
                        >
                            <option value="">{t.all_types}</option>
                            {Object.entries(t.types).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>

                        {/* Date Range */}
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm font-bold text-slate-600">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-500">
                                <Calendar size={14} /> {translations.grn?.from || (language === 'BAN' ? 'হতে' : 'From')}
                                <input 
                                    type="date" 
                                    value={dateRange.from} 
                                    max={format(new Date(), 'yyyy-MM-dd')}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                                    className="bg-transparent outline-none text-slate-700 cursor-pointer"
                                />
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-500">
                                <Calendar size={14} /> {translations.grn?.to || (language === 'BAN' ? 'পর্যন্ত' : 'To')}
                                <input 
                                    type="date" 
                                    value={dateRange.to} 
                                    max={format(new Date(), 'yyyy-MM-dd')}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                                    className="bg-transparent outline-none text-slate-700 cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Reset Button */}
                        {(searchTerm || typeFilter || dateRange.from || dateRange.to !== format(new Date(), 'yyyy-MM-dd')) && (
                            <button 
                                onClick={handleReset}
                                className="text-[10px] font-black text-rose-500 hover:text-rose-700 uppercase tracking-widest px-2 transition-colors"
                            >
                                {t.reset}
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <select 
                            value={perPage}
                            onChange={(e) => setPerPage(Number(e.target.value))}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 outline-none hover:bg-slate-50 transition-all cursor-pointer"
                        >
                            <option value={10}>{t.rows_info.replace('{n}', '10')}</option>
                            <option value={20}>{t.rows_info.replace('{n}', '20')}</option>
                            <option value={50}>{t.rows_info.replace('{n}', '50')}</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table Header Content */}
            <div className="flex-1 overflow-x-auto custom-scrollbar min-h-0">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 bg-white z-20 border-b border-slate-100">
                        <tr>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{t.table.date_type}</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{t.table.medicine_details}</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{t.table.batch_info}</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px] text-center">{t.table.qty_change}</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px] text-center">{t.table.stock_snapshot}</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{t.table.notes}</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px] text-center">{t.table.actions}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        <AnimatePresence mode="popLayout">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, idx) => (
                                    <tr key={idx} className="animate-pulse">
                                        {Array.from({ length: 7 }).map((_, cellIdx) => (
                                            <td key={cellIdx} className="px-8 py-6">
                                                <div className="h-4 bg-slate-100 rounded-full w-full"></div>
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : adjustments.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4 grayscale opacity-40">
                                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                                                <AlertTriangle size={32} className="text-slate-400" />
                                            </div>
                                            <div className="text-center">
                                                <p className="font-black text-slate-900 text-lg tracking-tight uppercase">{t.table.no_adjustments}</p>
                                                <p className="text-sm font-medium text-slate-500">{translations.sales_history?.adjust_filters || (language === 'BAN' ? 'আপনার ফিল্টার বা সার্চ টার্ম পরিবর্তন করে দেখুন' : 'Try adjusting your filters or search term')}</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                adjustments.map((item) => (
                                    <motion.tr 
                                        key={item.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="group hover:bg-indigo-50/20 transition-all duration-200"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-sm font-black text-slate-700">{format(new Date(item.created_at), 'MMM dd, yyyy')}</span>
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border w-fit ${typeStyles[item.adjustment?.type] || 'bg-slate-50 text-slate-500'}`}>
                                                    {t.types[item.adjustment?.type] || item.adjustment?.type?.replace('_', ' ') || '—'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 group-hover:scale-110 transition-transform">
                                                    <Package size={18} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-900 leading-tight">{item.medicine_name}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-1.5 text-xs font-black text-slate-700">
                                                <Hash size={12} className="text-slate-400" />
                                                {item.batch_number}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className={`text-sm font-black ${item.adjustment?.type === 'opening_balance' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {item.adjustment?.type === 'opening_balance' ? '+' : '-'}{item.adjustment?.qty_in_units} {item.adjustment?.unit}
                                                </div>

                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center text-sm font-black">
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{t.table.before}</span>
                                                    <span className="text-slate-600">{item.snapshot?.qty_before}</span>
                                                </div>
                                                <div className="w-px h-6 bg-slate-200"></div>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{t.table.after}</span>
                                                    <span className="text-indigo-600">{item.snapshot?.qty_after}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 max-w-[200px] line-clamp-2 italic">
                                                {item.note || t.table.no_notes}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <button 
                                                onClick={() => onDelete(item.id)}
                                                className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 rounded-xl transition-all shadow-sm group/btn"
                                            >
                                                <Trash2 size={16} className="group-hover/btn:scale-110 transition-transform" />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            {!isLoading && meta && meta.last_page > 1 && (
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[2px]">
                        {t.table.showing_meta
                            .replace('{from}', meta.from)
                            .replace('{to}', meta.to)
                            .replace('{total}', meta.total)}
                    </p>
                    <div className="flex items-center gap-2">
                        <button 
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-all shadow-sm"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="flex items-center gap-1.5">
                            {Array.from({ length: Math.min(meta.last_page, 5) }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPage(i + 1)}
                                    className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                                        page === i + 1 
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                                        : 'bg-white border border-slate-200 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button 
                            disabled={page === meta.last_page}
                            onClick={() => setPage(page + 1)}
                            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-all shadow-sm"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockAdjustmentTable;
