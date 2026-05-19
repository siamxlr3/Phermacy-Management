import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Wallet, DollarSign, RotateCcw } from 'lucide-react';
import { useLanguage } from '../../language/GlobalTranslate.jsx';
import { useGetRegisterStatusQuery } from '../../store/api/cashRegisterApi';

const ReportStats = ({ summary, returnsCount }) => {
    const { translations } = useLanguage();
    const { data: registerData } = useGetRegisterStatusQuery();
    const cashInHand = registerData?.summary?.current_balance ?? 0;

    const stats = [
        { 
            label: translations.sales_reports.total_revenue, 
            value: `৳${Number(summary?.total_revenue || 0).toLocaleString()}`, 
            icon: DollarSign, 
            color: 'emerald',
            change: 'Revenue'
        },
        { 
            label: translations.sales_reports.total_transaction, 
            value: Number(summary?.total_transactions || 0).toLocaleString(), 
            icon: TrendingUp, 
            color: 'indigo',
            change: 'Invoices'
        },
        { 
            label: translations.cash_register?.cash_in_hand || 'Cash in Hand', 
            value: `৳${Number(cashInHand).toLocaleString()}`, 
            icon: Wallet, 
            color: 'blue',
            change: 'Live Balance'
        },
        { 
            label: translations.sales_reports.total_returns, 
            value: summary?.returns_count || 0, 
            icon: RotateCcw, 
            color: 'rose',
            change: 'Last 30d' 
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
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                                stat.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                                stat.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                                'bg-rose-50 text-rose-600'
                            }`}>
                                <Icon size={24} />
                            </div>
                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${
                                stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-700' :
                                stat.color === 'indigo' ? 'bg-indigo-50 text-indigo-700' :
                                stat.color === 'blue' ? 'bg-blue-50 text-blue-700' :
                                'bg-rose-50 text-rose-700'
                            }`}>
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

