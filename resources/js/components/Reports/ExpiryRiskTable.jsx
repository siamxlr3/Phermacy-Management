import React from 'react';
import { AlertCircle, Calendar, Package, Truck } from 'lucide-react';

const ExpiryRiskTable = ({ risks }) => {
    return (
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-100 text-white">
                        <AlertCircle size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 tracking-tight">Expiring Soon Items</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expiring within 3 months</p>
                    </div>
                </div>
            </div>
            
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white z-10">
                        <tr className="border-b border-slate-100">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Medicine</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Batch</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiry</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Qty</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {risks?.map((risk, idx) => (
                            <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                                            <Package size={14} className="text-slate-400" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">{risk.medicine.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{risk.batch_number}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-rose-500">
                                            {risk.expiry_date?.split('T')[0]}
                                        </span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Expiring Soon</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Truck size={12} className="text-slate-300" />
                                        <span className="text-xs font-medium text-slate-500">{risk.supplier.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="text-xs font-black text-slate-900">{risk.qty_tablets_remaining} Units</span>
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
