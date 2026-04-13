import React from 'react';
import { CreditCard, Truck, ExternalLink } from 'lucide-react';

const SupplierDebtList = ({ dues }) => {
    return (
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-100 text-white">
                        <CreditCard size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 tracking-tight">Unpaid Supplier Bills</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Money to be paid for received items</p>
                    </div>
                </div>
            </div>
            
            <div className="flex-1 overflow-auto custom-scrollbar">
                <div className="p-4 flex flex-col gap-3">
                    {dues?.map((due, idx) => (
                        <div key={idx} className="p-5 bg-slate-50/50 rounded-[24px] border border-slate-100 group hover:border-rose-200 transition-all">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-rose-500 transition-colors shadow-sm">
                                        <Truck size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-slate-900">{due.supplier.name}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-black text-rose-600 tracking-tight">৳{Number(due.balance_due).toLocaleString()}</span>
                                    <div className="flex items-center justify-end gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                        <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest italic">Overdue</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400">Total order bill: ৳{Number(due.total_amount).toLocaleString()}</span>
                                <button className="text-[10px] font-black text-indigo-500 flex items-center gap-1 uppercase tracking-widest hover:text-indigo-700">
                                    View Bill <ExternalLink size={10} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {dues?.length === 0 && (
                        <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <CreditCard className="text-slate-400" />
                            </div>
                            <p className="text-xs font-black text-slate-900 uppercase tracking-widest">No Unpaid Bills</p>
                            <p className="text-[10px] font-medium text-slate-500">All received orders are fully paid</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SupplierDebtList;
