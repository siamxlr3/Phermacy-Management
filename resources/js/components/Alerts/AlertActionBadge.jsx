import React from 'react';
import { motion } from 'framer-motion';

const AlertActionBadge = ({ severity }) => {
    const getStyles = () => {
        switch (severity) {
            case 'Critical':
                return {
                    bg: 'bg-rose-50 text-rose-600 border-rose-100',
                    dot: 'bg-rose-500 shadow-rose-200',
                    pulse: 'bg-rose-400'
                };
            case 'Warning':
                return {
                    bg: 'bg-amber-50 text-amber-600 border-amber-100',
                    dot: 'bg-amber-500 shadow-amber-200',
                    pulse: 'bg-amber-400'
                };
            case 'Info':
                return {
                    bg: 'bg-blue-50 text-blue-600 border-blue-100',
                    dot: 'bg-blue-500 shadow-blue-200',
                    pulse: 'bg-blue-400'
                };
            default:
                return {
                    bg: 'bg-slate-50 text-slate-600 border-slate-100',
                    dot: 'bg-slate-500 shadow-slate-200',
                    pulse: 'bg-slate-400'
                };
        }
    };

    const styles = getStyles();

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${styles.bg} text-[10px] font-black uppercase tracking-widest relative overflow-hidden`}>
            {severity === 'Critical' && (
                <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className={`absolute inset-0 ${styles.bg} opacity-20`}
                />
            )}
            <div className="relative flex h-2 w-2">
                {severity === 'Critical' && (
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${styles.pulse} opacity-75`}></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${styles.dot} shadow-lg`}></span>
            </div>
            <span className="relative z-10">{severity}</span>
        </div>
    );
};

export default AlertActionBadge;
