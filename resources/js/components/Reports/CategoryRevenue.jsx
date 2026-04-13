import React from 'react';
import { Layers, PieChart } from 'lucide-react';

const CategoryRevenue = ({ categories }) => {
    const maxRevenue = Math.max(...(categories?.map(c => Number(c.total_revenue)) || [1]));

    return (
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100">
                        <Layers size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 tracking-tight">Revenue by Category</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Financial distribution</p>
                    </div>
                </div>
            </div>
            
            <div className="p-6 flex flex-col gap-6 flex-1 overflow-auto custom-scrollbar">
                {categories?.map((cat, idx) => {
                    const percentage = (Number(cat.total_revenue) / maxRevenue) * 100;
                    return (
                        <div key={idx} className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">{cat.category_name}</span>
                                <span className="text-[11px] font-black text-emerald-600">৳{Number(cat.total_revenue).toLocaleString()}</span>
                            </div>
                            <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                <div 
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-slate-400 uppercase">{cat.total_items} Transactions</span>
                                <span className="text-[9px] font-black text-slate-400">{Math.round(percentage)}% of Peak</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CategoryRevenue;
