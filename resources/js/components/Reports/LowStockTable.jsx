import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../language/GlobalTranslate.jsx';

const LowStockTable = ({ items = [] }) => {
    const { translations } = useLanguage();

    return (
        <div className="flex flex-col h-full bg-transparent overflow-hidden min-h-0">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-50/80 backdrop-blur-md z-10 border-b border-slate-200/60">
                        <tr>
                            <th className="px-6 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{translations.medicine?.medicine_name || 'Medicine Name'}</th>
                            <th className="px-6 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center">{translations.stock?.current_stock || 'Current Stock'}</th>
                            <th className="px-6 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center">{translations.medicine?.reorder_level || 'Reorder Level'}</th>
                            <th className="px-6 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right">{translations.medicine?.status || 'Status'}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/60">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-24 text-center">
                                    <div className="empty-state">
                                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl flex items-center justify-center mb-4 border border-emerald-100 shadow-sm mx-auto">
                                            <CheckCircle2 size={32} className="text-emerald-500" />
                                        </div>
                                        <p className="text-[15px] font-extrabold text-[#0f1923]">{translations.reports?.alerts?.all_clear || 'All Clear!'}</p>
                                        <p className="text-[12px] text-slate-400 font-bold mt-1">{translations.reports?.alerts?.healthy_desc || 'Stock levels are healthy'}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => {
                                const isCritical = item.stock === 0;
                                return (
                                    <tr
                                        key={item.id}
                                        className={`group transition-all duration-200 hover:bg-white/60 ${isCritical ? 'bg-rose-50/5' : ''}`}
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-extrabold text-[#0f1923] tracking-tight">{item.medicine_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-widest border ${
                                                isCritical ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                                {item.stock} LEFT
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="text-[12px] font-bold text-slate-500">{item.reorder_level}</span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest ${
                                                isCritical ? 'bg-rose-500 text-white shadow-sm' : 'bg-amber-500 text-white shadow-sm'
                                            }`}>
                                                {isCritical ? 'Out of Stock' : 'Low Stock'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LowStockTable;
