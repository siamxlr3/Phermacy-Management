import React from 'react';
import { Calendar, ChevronDown, RefreshCw } from 'lucide-react';
import { format, subDays, startOfMonth, startOfToday } from 'date-fns';

const DateRangeFilter = ({ fromDate, toDate, onChange, onReset, label = 'Order Date', hideLabel = false, hidePresets = false }) => {
  const quickFilters = [
    { label: 'Today', getValue: () => ({ from: startOfToday(), to: startOfToday() }) },
    { label: 'Last 7 Days', getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
    { label: 'Last 30 Days', getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
    { label: 'This Month', getValue: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  ];

  const handleQuickFilter = (filter) => {
    const range = filter.getValue();
    onChange(format(range.from, 'yyyy-MM-dd'), format(range.to, 'yyyy-MM-dd'));
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        {!hideLabel && label && (
          <div className="flex items-center gap-2 px-3 py-2 border-r border-slate-100 bg-slate-50/50">
            <Calendar size={14} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 px-3 py-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => onChange(e.target.value, toDate)}
            className="text-xs font-medium text-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
          />
          <span className="text-slate-300 mx-1">—</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => onChange(fromDate, e.target.value)}
            className="text-xs font-medium text-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-lg">
        {!hidePresets && quickFilters.map((filter) => (
          <button
            key={filter.label}
            onClick={() => handleQuickFilter(filter)}
            className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-700 hover:bg-white rounded-md transition-all active:scale-95"
          >
            {filter.label}
          </button>
        ))}
        {!hidePresets && <div className="w-px h-3 bg-slate-200 mx-0.5" />}
        <button
          onClick={onReset}
          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-md transition-all active:rotate-180 duration-300"
          title="Reset Filters"
        >
          <RefreshCw size={13} />
        </button>
      </div>
    </div>
  );
};

export default DateRangeFilter;
