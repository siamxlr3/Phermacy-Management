import React from 'react';
import { CreditCard, Truck } from 'lucide-react';
import { useLanguage } from '../../language/GlobalTranslate.jsx';
import { cn } from '../../lib/utils';

const SupplierDebtList = ({ dues, isLoading }) => {
    const { translations } = useLanguage();

    return (
        <div className="flex flex-col h-full overflow-hidden min-h-0">
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 border-b border-slate-100 shadow-sm">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">
                                {translations.reports.supplier_debt.supplier_partner}
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">
                                {translations.reports.supplier_debt.bill_date}
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px] text-right">
                                {translations.reports.supplier_debt.total_bill}
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px] text-right">
                                {translations.reports.supplier_debt.balance_due}
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
                        ) : dues?.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-8 py-32">
                                    <div className="flex flex-col items-center justify-center gap-4 grayscale opacity-40">
                                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                                            <CreditCard size={32} />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-black text-slate-900 text-lg tracking-tight">
                                                {translations.reports.supplier_debt.zero_debts}
                                            </p>
                                            <p className="text-sm font-medium text-slate-500">
                                                {translations.reports.supplier_debt.settled_desc}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            dues?.map((due, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50/60 transition-all duration-150">

                                    {/* Supplier */}
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                                                <Truck size={15} className="text-slate-400" />
                                            </div>
                                            <span className="text-sm font-black text-slate-700 group-hover:text-indigo-600 transition-colors">
                                                {due.supplier.name}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Bill Date */}
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-slate-700">
                                                {new Date(due.order_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                                                Bill Date
                                            </span>
                                        </div>
                                    </td>

                                    {/* Total Bill */}
                                    <td className="px-6 py-5 text-right whitespace-nowrap">
                                        <span className="text-sm font-black text-slate-500">
                                            ৳{Number(due.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </td>

                                    {/* Balance Due */}
                                    <td className="px-6 py-5 text-right whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                            <span className="text-sm font-black text-rose-600 tracking-tight">
                                                ৳{Number(due.balance_due).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </td>

                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SupplierDebtList;
