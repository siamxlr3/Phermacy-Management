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
                        {risks?.map((risk, idx) => (
                            <tr key={idx} className="group hover:bg-white/60 transition-all duration-200">
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Package size={16} className="text-slate-400" />
                                        </div>
                                        <span className="text-[13px] font-extrabold text-[#0f1923] tracking-tight group-hover:text-blue-600 transition-colors">
                                            {risk.medicine?.medicine_name || risk.medicine?.name || 'Unknown Medicine'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-md border border-slate-200/50">{risk.batch_number}</span>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-col">
                                        <span className="text-[12px] font-extrabold text-rose-500 jetbrains-mono">
                                            {risk.expiry_date?.split('T')[0]}
                                        </span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{translations.reports.expiry_risk.expiring_risk}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center">
                                            <Truck size={10} className="text-blue-500" />
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-600 tracking-tight">{risk.supplier.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <span className="text-[13px] font-extrabold text-[#0f1923] jetbrains-mono">{risk.qty_tablets_remaining}</span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase ml-1.5">{translations.reports.expiry_risk.units}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ExpiryRiskTable;
