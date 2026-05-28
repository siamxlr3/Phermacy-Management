import React from 'react';
import { motion } from 'framer-motion';
import { Database, TrendingUp, AlertCircle, ShoppingBag, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../../language/GlobalTranslate.jsx';
import { cn } from '../../lib/utils';

const StockValuationCards = ({ summaries, alertSummary, isLoading }) => {
    const { translations } = useLanguage();

    const cards = [
        {
            label: translations.reports.stock_valuation.total_price,
            value: summaries ? summaries.total_stock_value : null,
            sub:   translations.reports.stock_valuation.money_in_stock,
            icon:  Database,
            iconBg:   'bg-emerald-50',
            iconText: 'text-emerald-600',
            badge:     translations.reports.stock_valuation.live,
            badgeBg:  'bg-emerald-50 text-emerald-700',
            type: 'currency',
        },
        {
            label: translations.reports.stock_valuation.unpaid_bills,
            value: summaries ? summaries.total_pending_payments : null,
            sub:   translations.reports.stock_valuation.owe_suppliers,
            icon:  ShoppingBag,
            iconBg:   'bg-rose-50',
            iconText: 'text-rose-600',
            badge:     translations.reports.stock_valuation.unpaid,
            badgeBg:  'bg-rose-50 text-rose-700',
            type: 'currency',
        },
        {
            label: translations.reports.stock_valuation.low_stock,
            value: (summaries && summaries.low_stock_count !== undefined)
                ? summaries.low_stock_count
                : (alertSummary ? alertSummary.low_stock_alerts : null),
            sub:   translations.reports.stock_valuation.need_restocking,
            icon:  TrendingUp,
            iconBg:   'bg-teal-50',
            iconText: 'text-teal-600',
            badge:     translations.reports.stock_valuation.ok,
            badgeBg:  'bg-teal-50 text-teal-700',
        },
        {
            label: translations.reports.stock_valuation.expiring_soon,
            value: summaries ? summaries.expiry_count : null,
            sub:   translations.reports.stock_valuation.within_90_days,
            icon:  AlertCircle,
            iconBg:   'bg-amber-50',
            iconText: 'text-amber-600',
            badge:     translations.reports.stock_valuation.watch,
            badgeBg:  'bg-amber-50 text-amber-700',
        },
        {
            label: translations.reports.stock_valuation.expired_items,
            value: summaries ? summaries.expired_count : (alertSummary ? alertSummary.expiry_alerts : 0),
            sub:   translations.reports.stock_valuation.non_sellable,
            icon:  ShieldAlert,
            iconBg:   'bg-rose-50',
            iconText: 'text-rose-600',
            badge:     translations.reports.stock_valuation.critical,
            badgeBg:  'bg-rose-50 text-rose-700',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {cards.map((card, idx) => {
                const Icon = card.icon;
                const isLoaded = !isLoading && card.value !== null;

                return (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all"
                    >
                        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center border border-slate-100', card.iconBg, card.iconText)}>
                            <Icon size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{card.label}</span>
                            {isLoaded ? (
                                <h3 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                                    {card.type === 'currency' ? '৳' : ''}{Number(card.value).toLocaleString()}
                                </h3>
                            ) : (
                                <div className="h-6 w-20 bg-slate-100 rounded-md animate-pulse mt-1" />
                            )}
                            <span className="block text-[10px] font-bold text-slate-400 mt-0.5 truncate">{card.sub}</span>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default StockValuationCards;
