import React from 'react';
import { Package, TrendingUp, Award } from 'lucide-react';
import { useLanguage } from '../../language/GlobalTranslate.jsx';

const TopMedicinesTable = ({ medicines }) => {
    const { translations } = useLanguage();
    return (
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                        <Award size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 tracking-tight">{translations.sales_reports.top_selling}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{translations.sales_reports.based_on_qty}</p>
                    </div>
                </div>
            </div>
            
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white z-10">
                        <tr className="border-b border-slate-100">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{translations.sales_reports.rank}</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{translations.sales_reports.medicine}</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{translations.sales_reports.qty}</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{translations.sales_reports.revenue}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {medicines?.map((med, idx) => (
                            <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                                        idx === 0 ? 'bg-amber-100 text-amber-700' : 
                                        idx === 1 ? 'bg-slate-100 text-slate-700' :
                                        idx === 2 ? 'bg-orange-100 text-orange-700' : 'text-slate-400'
                                    }`}>
                                        {idx + 1}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                                            <Package size={14} className="text-slate-400" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{med.medicine_name || med.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right text-xs font-black text-slate-600">
                                    {Number(med.total_qty).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="text-xs font-black text-emerald-600">৳{Number(med.total_revenue).toLocaleString()}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TopMedicinesTable;
