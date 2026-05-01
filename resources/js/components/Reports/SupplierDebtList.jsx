import React from 'react';
import { CreditCard, Truck, ExternalLink } from 'lucide-react';

const SupplierDebtList = ({ dues }) => {
    return (
        <div className="flex flex-col h-full bg-transparent overflow-hidden min-h-0">
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-50/80 backdrop-blur-md z-10 border-b border-slate-200/60">
                        <tr>
                            <th className="px-6 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Supplier Partner</th>
                            <th className="px-6 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Bill Date</th>
                            <th className="px-6 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right">Total Bill</th>
                            <th className="px-6 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right">Balance Due</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/60">
                        {dues?.map((due, idx) => (
                            <tr key={idx} className="group hover:bg-white/60 transition-all duration-200">
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Truck size={16} className="text-slate-400" />
                                        </div>
                                        <span className="text-[13px] font-extrabold text-[#0f1923] tracking-tight group-hover:text-rose-600 transition-colors">{due.supplier.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="text-[12px] font-extrabold text-slate-600 jetbrains-mono">
                                        {due.order_date?.split('T')[0]}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <span className="text-[12px] font-bold text-slate-500">৳{Number(due.total_amount).toLocaleString()}</span>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                        <span className="text-[14px] font-black text-rose-600 tracking-tighter jetbrains-mono">৳{Number(due.balance_due).toLocaleString()}</span>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {dues?.length === 0 && (
                            <tr>
                                <td colSpan="4" className="py-24">
                                    <div className="flex flex-col items-center justify-center text-center">
                                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl flex items-center justify-center mb-5 border border-emerald-100 shadow-sm">
                                            <CreditCard size={36} className="text-emerald-400" />
                                        </div>
                                        <p className="text-[16px] font-extrabold text-[#0f1923]">Zero Outstanding Debts</p>
                                        <p className="text-[12px] text-slate-400 font-bold mt-1 uppercase tracking-widest">All supplier accounts are settled</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SupplierDebtList;
