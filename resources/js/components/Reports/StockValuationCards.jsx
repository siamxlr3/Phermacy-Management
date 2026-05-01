import React from 'react';
import { motion } from 'framer-motion';
import { Database, TrendingUp, AlertCircle, ShoppingBag, Bell, ShieldAlert } from 'lucide-react';

const StockValuationCards = ({ summaries, alertSummary, isLoading }) => {
    const cards = [
        {
            label: 'Stock Price Total',
            value: summaries ? summaries.total_stock_value : null,
            sub: 'Money in Stock',
            icon: Database,
            color: 'emerald',
            badge: 'LIVE',
            emoji: '📦',
            type: 'currency'
        },
        {
            label: 'Unpaid Supplier Bills',
            value: summaries ? summaries.total_pending_payments : null,
            sub: 'What we owe Suppliers',
            icon: ShoppingBag,
            color: 'rose',
            badge: 'UNPAID',
            emoji: '💳',
            type: 'currency'
        },
        {
            label: 'Low Stock Items',
            value: alertSummary ? alertSummary.low_stock_alerts : (summaries ? summaries.low_stock_count : null),
            sub: 'Need Restocking',
            icon: TrendingUp,
            color: 'teal',
            badge: 'OK',
            emoji: '📉'
        },
        {
            label: 'Expiring Soon',
            value: summaries ? summaries.expiry_count : null,
            sub: 'Within 90 Days',
            icon: AlertCircle,
            color: 'amber',
            badge: 'WATCH',
            emoji: '⚠️'
        },
        {
            label: 'Expired Items',
            value: summaries ? summaries.expired_count : (alertSummary ? alertSummary.expiry_alerts : 0),
            sub: 'Non-sellable stock',
            icon: ShieldAlert,
            color: 'rose',
            badge: 'CRITICAL',
            emoji: '❌'
        }
    ];

    const colorMap = {
        emerald: { icon: 'bg-emerald-500/10 text-emerald-500', badge: 'bg-emerald-500/10 text-emerald-600', border: 'hover:before:bg-emerald-500' },
        rose: { icon: 'bg-rose-500/10 text-rose-500', badge: 'bg-rose-500/10 text-rose-600', border: 'hover:before:bg-rose-500' },
        teal: { icon: 'bg-teal-500/10 text-teal-500', badge: 'bg-teal-500/10 text-teal-600', border: 'hover:before:bg-teal-500' },
        amber: { icon: 'bg-amber-500/10 text-amber-500', badge: 'bg-amber-500/10 text-amber-600', border: 'hover:before:bg-amber-500' }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {cards.map((card, idx) => {
                const Icon = card.icon;
                const isLoaded = !isLoading && card.value !== null;
                const style = colorMap[card.color] || colorMap.rose;

                return (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`premium-glass p-5 rounded-[18px] flex flex-col relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/50 before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:opacity-0 hover:before:opacity-100 before:transition-opacity ${style.border}`}
                    >
                        <div className="flex items-start justify-between mb-3.5 relative z-10">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${style.icon}`}>
                                <Icon size={18} />
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider ${style.badge}`}>
                                {card.badge}
                            </span>
                        </div>
                        
                        <div className="relative z-10">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.8px] mb-1.5">{card.label}</p>
                            
                            {isLoaded ? (
                                <h3 className="text-[28px] font-extrabold text-[#0f1923] tracking-tighter leading-none jetbrains-mono">
                                    {card.type === 'currency' ? '৳' : ''}{Number(card.value).toLocaleString()}
                                </h3>
                            ) : (
                                <div className="h-7 w-24 bg-slate-200/50 rounded-lg animate-pulse" />
                            )}
                            
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{card.sub}</p>
                        </div>

                        {/* Decor Emoji */}
                        <div className="absolute -bottom-2 -right-1 text-[50px] opacity-[0.04] pointer-events-none group-hover:scale-110 transition-transform duration-500">
                            {card.emoji}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default StockValuationCards;
