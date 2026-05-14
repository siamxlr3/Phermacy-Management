import React, { useState } from 'react';
import { useLanguage } from '../../language/GlobalTranslate.jsx';
import { useGetReturnsQuery } from '../../store/api/returnsApi';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Calendar, ChevronLeft, ChevronRight, Eye, MoreHorizontal, Download, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

const ReturnsTable = () => {
    const { translations } = useLanguage();
    const t = translations?.returns?.table;
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [perPage, setPerPage] = useState(10);
    const [dateRange, setDateRange] = useState({
        from: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        to: format(new Date(), 'yyyy-MM-dd')
    });

    const { data: returnsData, isLoading } = useGetReturnsQuery({
        page,
        perPage,
        search: searchTerm,
        fromDate: dateRange.from,
        toDate: dateRange.to
    });

    const returns = returnsData?.data || [];
    const meta = returnsData?.meta || {};

    return (
        <div className="flex flex-col h-full bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-0">
            {/* Table Header / Filters */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 max-w-2xl">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder={t?.search_placeholder || "Search by return invoice number..."}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all placeholder:text-slate-400 text-slate-600"
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 text-xs font-bold text-slate-500">
                                <Calendar size={14} /> {t?.from || 'From'}
                                <input 
                                    type="date" 
                                    value={dateRange.from} 
                                    onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                                    className="bg-transparent outline-none text-slate-700"
                                />
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 text-xs font-bold text-slate-500">
                                <Calendar size={14} /> {t?.to || 'To'}
                                <input 
                                    type="date" 
                                    value={dateRange.to} 
                                    onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                                    className="bg-transparent outline-none text-slate-700"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <select 
                            value={perPage}
                            onChange={(e) => setPerPage(Number(e.target.value))}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 outline-none focus:ring-4 focus:ring-slate-500/5 transition-all"
                        >
                            <option value={10}>{t?.per_page?.replace('{n}', '10') || '10 per page'}</option>
                            <option value={20}>{t?.per_page?.replace('{n}', '20') || '20 per page'}</option>
                            <option value={50}>{t?.per_page?.replace('{n}', '50') || '50 per page'}</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-x-auto custom-scrollbar min-h-0">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead className="sticky top-0 bg-white z-10 border-b border-slate-100 shadow-sm shadow-slate-200/5">
                        <tr>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{t?.headers?.date || 'Return Date'}</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{t?.headers?.info || 'Return Info'}</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{t?.headers?.original_sale || 'Original Sale'}</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{t?.headers?.items || 'Returned Items'}</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{t?.headers?.refund || 'Refund Details'}</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{t?.headers?.reason || 'Reason'}</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px] text-right">{t?.headers?.actions || 'Actions'}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, idx) => (
                                <tr key={idx} className="animate-pulse">
                                    {Array.from({ length: 6 }).map((_, cellIdx) => (
                                        <td key={cellIdx} className="px-8 py-6">
                                            <div className="h-4 bg-slate-100 rounded-full w-full"></div>
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : returns.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-8 py-32">
                                    <div className="flex flex-col items-center justify-center gap-4 grayscale opacity-40">
                                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                                            <Search size={32} />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-black text-slate-900 text-lg tracking-tight">{t?.no_records || 'No returns found'}</p>
                                            <p className="text-sm font-medium text-slate-500">{t?.adjust_filters || 'Try adjusting your filters or search term'}</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            returns.map((item) => (
                                <tr key={item.id} className="group hover:bg-slate-50/80 transition-all duration-200">
                                    <td className="px-8 py-6">
                                        <span className="text-sm font-bold text-slate-700">{format(new Date(item.return_date), 'MMM dd, yyyy')}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1.5">
                                            <span className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-black border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all w-fit">
                                                {item.return_invoice_number}
                                            </span>
                                            <span className={`text-[9px] font-black uppercase tracking-widest w-fit px-2 py-0.5 rounded ${item.return_type === 'full' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {item.return_type === 'full' ? (t?.full_return || 'Full Return') : (t?.partial_return || 'Partial Return')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                                            {item.sale_invoice}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-2.5">
                                            {item.items?.map((ritem, idx) => {
                                                const unitLabel = ritem.sale_unit === 'Tablet'
                                                    ? (ritem.dosage_form || 'Pc')
                                                    : (ritem.sale_unit || 'Pc');

                                                const conditionColor = {
                                                    resellable: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                                                    damaged:    'bg-amber-50 text-amber-600 border-amber-100',
                                                    expired:    'bg-rose-50 text-rose-500 border-rose-100',
                                                }[ritem.return_condition] || 'bg-slate-50 text-slate-500 border-slate-100';

                                                return (
                                                    <div key={idx} className={`flex flex-col gap-1 ${idx > 0 ? 'pt-2.5 border-t border-slate-100' : ''}`}>
                                                        {/* Medicine name */}
                                                        <span className="text-xs font-black text-slate-800 leading-tight">
                                                            {ritem.medicine_name}
                                                        </span>
                                                        {/* Qty + Unit type + Price row */}
                                                        <div className="flex items-center flex-wrap gap-1.5">
                                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-full text-[9px] font-black uppercase tracking-wide">
                                                                ×{ritem.qty_returned} {unitLabel}
                                                            </span>
                                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-[9px] font-black uppercase tracking-wide">
                                                                {unitLabel}
                                                            </span>
                                                            <span className="text-[9px] font-bold text-slate-400">
                                                                @৳{parseFloat(ritem.unit_price).toFixed(2)}
                                                            </span>
                                                        </div>
                                                        {/* Condition badge */}
                                                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border w-fit ${conditionColor}`}>
                                                            {ritem.return_condition}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-black text-slate-900">${parseFloat(item.total_returned).toFixed(2)}</span>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                                <CreditCard size={10} /> {item.refund_method}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-xs font-bold text-slate-500 line-clamp-1 max-w-[200px]">{item.reason}</p>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                                                <Eye size={18} />
                                            </button>
                                            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                                                <MoreHorizontal size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Sidebar Footer */}
            {!isLoading && meta.last_page > 1 && (
                <div className="shrink-0 p-6 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[2px]">
                        {(t?.showing_records || 'Showing {from}-{to} of {total} returns')
                            .replace('{from}', meta.from)
                            .replace('{to}', meta.to)
                            .replace('{total}', meta.total)}
                    </p>
                    <div className="flex items-center gap-2">
                        <button 
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-400 transition-all shadow-sm"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: meta.last_page }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPage(i + 1)}
                                    className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
                                        page === i + 1 
                                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
                                        : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button 
                            disabled={page === meta.last_page}
                            onClick={() => setPage(page + 1)}
                            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-400 transition-all shadow-sm"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReturnsTable;
