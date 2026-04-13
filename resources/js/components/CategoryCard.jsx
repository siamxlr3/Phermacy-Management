import React from 'react';
import { cn } from '../lib/utils';

const CategoryCard = ({ title, active, icon: Icon }) => {
  return (
    <button className={cn(
      "p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 w-full group",
      active 
        ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200" 
        : "bg-white border-zinc-100 text-zinc-600 hover:border-emerald-200 hover:bg-emerald-50/50"
    )}>
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
        active ? "bg-white/20" : "bg-zinc-50 group-hover:bg-emerald-100"
      )}>
        <Icon size={20} className={active ? "text-white" : "group-hover:text-emerald-600"} />
      </div>
      <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
    </button>
  );
};

export default CategoryCard;
