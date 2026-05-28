import React from 'react';
import { AlertTriangle, CheckCircle2, TrendingDown } from 'lucide-react';
import { useLanguage } from '../../language/GlobalTranslate.jsx';
import { cn } from '../../lib/utils';

const LowStockTable = ({ items = [], isLoading }) => {
    const { translations } = useLanguage();

    return (
        <div className="flex flex-col h-full overflow-hidden min-h-0">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 border-b border-slate-100 shadow-sm">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">
                                {translations.medicine?.medicine_name || 'Medicine Name'}
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px] text-center">
                                {translations.stock?.current_stock || 'Current Stock'}
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px] text-center">
                                {translations.medicine?.reorder_level || 'Reorder Level'}
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px] text-right">
                                {translations.medicine?.status || 'Status'}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    {Array.from({ length: 4 }).map((_, j) => (
                                        <td key={j} className="px-6 py-5">
                                            <div className="h-4 bg-slate-100 rounded-md w-full" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-8 py-32">
                                    <div className="flex flex-col items-center justify-center gap-4 grayscale opacity-40">
                                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                                            <CheckCircle2 size={32} />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-black text-slate-900 text-lg tracking-tight">
                                                {translations.reports?.alerts?.all_clear || 'All Clear!'}
                                            </p>
                                            <p className="text-sm font-medium text-slate-500">
                                                {translations.reports?.alerts?.healthy_desc || 'Stock levels are healthy'}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => {
                                const isCritical = item.stock === 0;
                                return (
                                    <tr
                                        key={item.id}
                                        className="group hover:bg-slate-50/60 transition-all duration-150"
                                    >
                                        {/* Medicine Name */}
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    'w-8 h-8 rounded-xl flex items-center justify-center border',
                                                    isCritical ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'
                                                )}>
                                                    <TrendingDown size={14} className={isCritical ? 'text-rose-500' : 'text-amber-500'} />
                                                </div>
                                                <span className="text-sm font-black text-slate-700">{item.medicine_name}</span>
                                            </div>
                                        </td>

                                        {/* Current Stock */}
                                        <td className="px-6 py-5 text-center">
                                            <span className={cn(
                                                'inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider',
                                                isCritical
                                                    ? 'bg-rose-50 text-rose-700'
                                                    : 'bg-amber-50 text-amber-700'
                                            )}>
                                                {item.stock} left
                                            </span>
                                        </td>

                                        {/* Reorder Level */}
                                        <td className="px-6 py-5 text-center">
                                            <span className="text-xs font-bold text-slate-500">{item.reorder_level}</span>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-5 text-right">
                                            <span className={cn(
                                                'inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider',
                                                isCritical
                                                    ? 'bg-rose-500 text-white'
                                                    : 'bg-amber-500 text-white'
                                            )}>
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
