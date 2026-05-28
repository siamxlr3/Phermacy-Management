import React from 'react';
import { Clock, Package, Truck } from 'lucide-react';
import { useLanguage } from '../../language/GlobalTranslate.jsx';
import { cn } from '../../lib/utils';

const ExpiryRiskTable = ({ risks, isLoading }) => {
    const { translations } = useLanguage();

    return (
        <div className="flex flex-col h-full overflow-hidden min-h-0">
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 border-b border-slate-100 shadow-sm">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">
                                {translations.reports.expiry_risk.medicine}
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">
                                {translations.reports.expiry_risk.batch}
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">
                                {translations.reports.expiry_risk.expiry_date}
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">
                                {translations.reports.expiry_risk.supplier}
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px] text-right">
                                {translations.reports.expiry_risk.qty_units}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    {Array.from({ length: 5 }).map((_, j) => (
                                        <td key={j} className="px-6 py-5">
                                            <div className="h-4 bg-slate-100 rounded-md w-full" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : !risks || risks.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-8 py-32">
                                    <div className="flex flex-col items-center justify-center gap-4 grayscale opacity-40">
                                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                                            <Clock size={32} />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-black text-slate-900 text-lg tracking-tight">No Expiry Risks</p>
                                            <p className="text-sm font-medium text-slate-500">All batches are within safe dates</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            risks.map((risk, idx) => {
                                const isExpired = new Date(risk.expiry_date) <= new Date();
                                return (
                                    <tr
                                        key={idx}
                                        className={cn(
                                            'group transition-all duration-150',
                                            isExpired ? 'bg-rose-50/30 hover:bg-rose-50/50' : 'hover:bg-slate-50/60'
                                        )}
                                    >
                                        {/* Medicine */}
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    'w-9 h-9 rounded-xl border flex items-center justify-center',
                                                    isExpired ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'
                                                )}>
                                                    <Package size={15} className={isExpired ? 'text-rose-500' : 'text-slate-400'} />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        'text-sm font-black tracking-tight',
                                                        isExpired ? 'text-rose-700' : 'text-slate-700'
                                                    )}>
                                                        {risk.medicine?.medicine_name || risk.medicine?.name || 'Unknown Medicine'}
                                                    </span>
                                                    {isExpired && (
                                                        <span className="px-2 py-0.5 bg-rose-500 text-white text-[9px] font-black uppercase rounded-full tracking-wider">
                                                            {translations.reports.expired_tag || 'Expired'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Batch */}
                                        <td className="px-6 py-5">
                                            <span className={cn(
                                                'inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider',
                                                isExpired
                                                    ? 'bg-rose-50 text-rose-700'
                                                    : 'bg-slate-100 text-slate-500'
                                            )}>
                                                {risk.batch_number}
                                            </span>
                                        </td>

                                        {/* Expiry Date */}
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className={cn(
                                                    'text-xs font-black',
                                                    isExpired ? 'text-rose-600' : 'text-amber-500'
                                                )}>
                                                    {risk.expiry_date?.split('T')[0]}
                                                </span>
                                                <span className={cn(
                                                    'text-[9px] font-bold uppercase tracking-widest mt-0.5',
                                                    isExpired ? 'text-rose-400' : 'text-slate-400'
                                                )}>
                                                    {isExpired
                                                        ? (translations.reports.expired_status || 'Expired')
                                                        : (translations.reports.expiring_soon_status || 'Expiring Soon')}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Supplier */}
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    'w-6 h-6 rounded-lg flex items-center justify-center',
                                                    isExpired ? 'bg-rose-50' : 'bg-slate-100'
                                                )}>
                                                    <Truck size={11} className={isExpired ? 'text-rose-500' : 'text-slate-400'} />
                                                </div>
                                                <span className={cn(
                                                    'text-xs font-bold',
                                                    isExpired ? 'text-rose-700' : 'text-slate-600'
                                                )}>
                                                    {risk.supplier?.name || 'Unknown'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Qty */}
                                        <td className="px-6 py-5 text-right whitespace-nowrap">
                                            <span className={cn(
                                                'text-sm font-black',
                                                isExpired ? 'text-rose-700' : 'text-slate-700'
                                            )}>
                                                {risk.qty_tablets_remaining}
                                            </span>
                                            <span className={cn(
                                                'text-[10px] font-bold uppercase ml-1.5',
                                                isExpired ? 'text-rose-400' : 'text-slate-400'
                                            )}>
                                                {translations.reports.expiry_risk.units}
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

export default ExpiryRiskTable;
