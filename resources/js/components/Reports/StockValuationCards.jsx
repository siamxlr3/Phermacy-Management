import React from 'react';
import { motion } from 'framer-motion';
import { Database, TrendingUp, AlertCircle, ShoppingBag } from 'lucide-react';

const StockValuationCards = ({ summaries, isLoading }) => {
    const cards = [
        {
            label: 'Stock Price Total',
            value: summaries ? `৳${Number(summaries.total_stock_value || 0).toLocaleString()}` : null,
            sub: summaries ? `Across ${summaries.category_count} Categories` : 'Money in Stock',
            icon: Database,
            color: 'indigo'
        },
        {
            label: 'Unpaid Money',
            value: summaries ? `৳${Number(summaries.total_pending_payments || 0).toLocaleString()}` : null,
            sub: 'What we owe Suppliers',
            icon: ShoppingBag,
            color: 'rose'
        },
        {
            label: 'Expiring Soon',
            value: summaries ? Number(summaries.expiry_count || 0).toLocaleString() : null,
            sub: 'Items (90 Days)',
            icon: AlertCircle,
            color: 'amber'
        },
        {
            label: 'Low Stock Items',
            value: summaries ? Number(summaries.low_stock_count || 0).toLocaleString() : null,
            sub: 'Need Restocking',
            icon: TrendingUp,
            color: 'emerald'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card, idx) => {
                const Icon = card.icon;
                const isLoaded = !isLoading && card.value !== null;

                return (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col gap-4 relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500"
                    >
                        {/* Background Decor */}
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-${card.color}-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700`} />
                        
                        {/* Icon Holder */}
                        <div className={`w-12 h-12 rounded-2xl bg-${card.color}-50 flex items-center justify-center text-${card.color}-600 relative z-10 ${!isLoaded ? 'animate-pulse' : ''}`}>
                            <Icon size={24} />
                        </div>
                        
                        <div className="relative z-10 w-full">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-1">{card.label}</p>
                            
                            {isLoaded ? (
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{card.value}</h3>
                            ) : (
                                <div className="h-8 w-24 bg-slate-100 rounded-lg animate-pulse" />
                            )}
                            
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{card.sub}</p>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default StockValuationCards;
