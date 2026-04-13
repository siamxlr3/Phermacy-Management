import React, { useState, useEffect } from 'react';
import { useGetStockOverviewQuery } from '../../store/api/stockApi';
import { Search, Package, AlertTriangle, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';

const StockOverviewTable = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, isLoading, isFetching } = useGetStockOverviewQuery({ 
    page, 
    perPage, 
    search: debouncedSearch 
  });

  const stocks = data?.data?.data || [];
  const meta = data?.data || {};
  const isLoadingState = isLoading || isFetching;

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="shrink-0 p-6 border-b border-slate-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <BarChart3 size={16} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Inventory Summary</h2>
            <p className="text-[11px] text-slate-400 font-medium">Aggregated stock levels per medicine</p>
          </div>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search medicine..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none w-64 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Medicine ID & Name</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Batch Count</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Total Stock</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Next Expiry</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap border-r-0">Storage Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoadingState ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-40"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-12 mx-auto"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20 mx-auto"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24 mx-auto"></div></td>
                  <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-full w-20 mx-auto"></div></td>
                </tr>
              ))
            ) : stocks.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-20 text-center text-slate-400 font-bold">No stock records found</td>
              </tr>
            ) : (
              stocks.map((stock, i) => {
                const isLow = stock.total_stock < (stock.medicine?.reorder_level || 500);
                return (
                  <tr key={i} className="hover:bg-slate-50/50 transition-all duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">ID: {stock.medicine_id}</span>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700">{stock.medicine?.name}</span>
                          <span className="text-[11px] text-slate-400 font-medium">{stock.medicine?.category?.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">{stock.batch_count}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-sm font-bold ${isLow ? 'text-red-600' : 'text-slate-700'}`}>
                        {parseInt(stock.total_stock).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-slate-600">{stock.next_expiry}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isLow ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {isLow ? <AlertTriangle size={10} /> : <Package size={10} />}
                        {isLow ? 'Low Stock' : 'Optimized'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30">
        <span className="text-xs text-slate-400 font-medium">Page {meta.current_page || 1}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-400 disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setPage(p => Math.min(p + 1, meta.last_page || 1))}
            disabled={page >= (meta.last_page || 1)}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-400 disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockOverviewTable;
