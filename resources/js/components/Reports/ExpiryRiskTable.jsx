import React from 'react';
import { AlertCircle, Calendar, Package, Truck } from 'lucide-react';
import { useLanguage } from '../../language/GlobalTranslate.jsx';

const ExpiryRiskTable = ({ risks }) => {
    const { translations } = useLanguage();
    return (
        <div className="flex flex-col h-full bg-transparent overflow-hidden min-h-0">
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-50/80 backdrop-blur-md z-10 border-b border-slate-200/60">
                        <tr>
                            <th className="px-6 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{translations.reports.expiry_risk.medicine}</th>
                            <th className="px-6 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{translations.reports.expiry_risk.batch}</th>
                            <th className="px-6 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{translations.reports.expiry_risk.expiry_date}</th>
                            <th className="px-6 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{translations.reports.expiry_risk.supplier}</th>
                            <th className="px-6 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right">{translations.reports.expiry_risk.qty_units}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/60">
                        {risks?.map((risk, idx) => {
                            const isExpired = new Date(risk.expiry_date) <= new Date();
                            return (
                                <tr key={idx} className={`group transition-all duration-200 ${isExpired ? 'bg-rose-50/30 hover:bg-rose-50/50' : 'hover:bg-white/60'}`}>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-transform ${
                                                isExpired ? 'bg-rose-100 border-rose-200' : 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200'
                                            }`}>
                                                <Package size={16} className={isExpired ? 'text-rose-500' : 'text-slate-400'} />
                                            </div>
                                            <span className={`text-[13px] font-extrabold tracking-tight transition-colors ${
                                                isExpired ? 'text-rose-700' : 'text-[#0f1923] group-hover:text-blue-600'
                                            }`}>
                                                {risk.medicine?.medicine_name || risk.medicine?.name || 'Unknown Medicine'}
                                            </span>
                                            {isExpired && (
                                                <span className="px-2 py-0.5 bg-rose-500 text-white text-[9px] font-black uppercase rounded-full tracking-tighter">
                                                    {translations.reports.expired_tag || 'Expired'}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`text-[11px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-md border ${
                                            isExpired ? 'bg-rose-100 text-rose-600 border-rose-200/50' : 'bg-slate-100 text-slate-500 border-slate-200/50'
                                        }`}>
                                            {risk.batch_number}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className={`text-[12px] font-extrabold jetbrains-mono ${isExpired ? 'text-rose-600' : 'text-amber-500'}`}>
                                                {risk.expiry_date?.split('T')[0]}
                                            </span>
                                            <span className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${isExpired ? 'text-rose-400' : 'text-slate-400'}`}>
                                                {isExpired ? (translations.reports.expired_status || 'Expired') : (translations.reports.expiring_soon_status || 'Expiring Soon')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isExpired ? 'bg-rose-100' : 'bg-blue-50'}`}>
                                                <Truck size={10} className={isExpired ? 'text-rose-500' : 'text-blue-500'} />
                                            </div>
                                            <span className={`text-[11px] font-bold tracking-tight ${isExpired ? 'text-rose-700' : 'text-slate-600'}`}>
                                                {risk.supplier?.name || 'Unknown'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <span className={`text-[13px] font-extrabold jetbrains-mono ${isExpired ? 'text-rose-700' : 'text-[#0f1923]'}`}>
                                            {risk.qty_tablets_remaining}
                                        </span>
                                        <span className={`text-[10px] font-bold uppercase ml-1.5 ${isExpired ? 'text-rose-400' : 'text-slate-400'}`}>
                                            {translations.reports.expiry_risk.units}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ExpiryRiskTable;
