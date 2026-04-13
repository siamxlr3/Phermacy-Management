import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, CreditCard, Users, DollarSign, RotateCcw } from 'lucide-react';

const ReportStats = ({ summary, returnsCount }) => {
    const stats = [
        { 
            label: 'Total Revenue', 
            value: `৳${Number(summary?.total_revenue || 0).toLocaleString()}`, 
            icon: DollarSign, 
            color: 'emerald',
            change: '+12.5%' // Mock trend for UX
        },

        { 
            label: 'Total Orders', 
            value: Number(summary?.total_orders || 0).toLocaleString(), 
            icon: TrendingUp, 
            color: 'indigo',
            change: '+8.1%'
        },
        { 
            label: 'Avg. Order Value', 
            value: `৳${Number(summary?.total_orders > 0 ? summary.total_receivable / summary.total_orders : 0).toFixed(2)}`, 
            icon: CreditCard, 
            color: 'blue',
            change: '+2.4%'
        },
        { 
            label: 'Total Returns', 
            value: returnsCount || 0, 
            icon: RotateCcw, 
            color: 'rose',
            change: 'Last 30d' // We can just provide a label or calculation
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                    <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col gap-4 relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500"
                    >
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-${stat.color}-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700`} />
                        
                        <div className="flex items-center justify-between relative z-10">
                            <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600`}>
                                <Icon size={24} />
                            </div>
                            <span className={`text-[10px] font-black px-2 py-1 bg-${stat.color}-50 text-${stat.color}-700 rounded-lg`}>
                                {stat.change}
                            </span>
                        </div>
                        
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-1">{stat.label}</p>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default ReportStats;
