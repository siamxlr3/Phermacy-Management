import React from 'react';

const AlertActionBadge = ({ severity }) => {
    const getStyles = () => {
        switch (severity) {
            case 'Critical':
                return 'bg-rose-500/10 text-rose-600 border-rose-200/50';
            case 'Warning':
                return 'bg-amber-500/10 text-amber-600 border-amber-200/50';
            case 'Info':
                return 'bg-blue-500/10 text-blue-600 border-blue-200/50';
            default:
                return 'bg-slate-500/10 text-slate-600 border-slate-200/50';
        }
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest border shadow-sm ${getStyles()}`}>
            {severity === 'Critical' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 animate-pulse" />}
            {severity}
        </span>
    );
};

export default AlertActionBadge;
