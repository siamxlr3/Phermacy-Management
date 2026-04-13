import React from 'react';
import { cn } from '../lib/utils';

const StatCard = ({ title, value, icon: Icon, trend, color }) => {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-all group">
      <div className="flex justify-between items-start">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border", colors[color])}>
          <Icon size={24} />
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-semibold px-2 py-1 rounded-full",
            trend > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
          )}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-zinc-500 text-sm font-medium">{title}</p>
        <h3 className="text-3xl font-bold text-zinc-900 mt-1">{value}</h3>
      </div>
    </div>
  );
};

export default StatCard;
