import React, { useState, useEffect } from 'react';
import { useGetGRNsQuery, useDeleteGRNMutation } from '../../store/api/grnApi';
import { Search, Plus, Eye, Receipt, Truck, User, ChevronLeft, ChevronRight, Trash2, Edit2 } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { motion } from 'framer-motion';
import DateRangeFilter from '../Shared/DateRangeFilter';
import toast from 'react-hot-toast';

const GRNTable = ({ onAdd, onEdit }) => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, isLoading, isFetching } = useGetGRNsQuery({ 
    page, 
    perPage, 
    search: debouncedSearch,
    from_date: fromDate,
    to_date: toDate
  });

  const [deleteGRN, { isLoading: isDeleting }] = useDeleteGRNMutation();

  const handleDelete = async (e, grn) => {
    e.stopPropagation();
    if (!confirm(`Delete GRN for PO ${grn.purchase_order?.po_number || '#' + grn.purchase_order_id}? This will reverse all stock changes.`)) return;
    try {
      await deleteGRN(grn.id).unwrap();
      toast.success('GRN deleted and stock reversed');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete GRN');
    }
  };

  const grns = data?.data || [];
  const meta = data?.meta || {};
  const isLoadingState = isLoading || isFetching;

  return (
    <div className="flex flex-col h-full min-h-0 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header & Filters */}
      <div className="shrink-0 p-6 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <DateRangeFilter 
            fromDate={fromDate} 
            toDate={toDate} 
            hideLabel={true}
            onChange={(from, to) => { setFromDate(from); setToDate(to); setPage(1); }}
            onReset={() => { setFromDate(format(subDays(new Date(), 30), 'yyyy-MM-dd')); setToDate(format(new Date(), 'yyyy-MM-dd')); setPage(1); }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:flex-initial">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Invoice or Supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none w-full sm:w-64 placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm shadow-blue-200 transition-all whitespace-nowrap"
          >
            <Plus size={16} /> Receive Goods
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-x-auto min-h-0 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 border-b border-slate-200">
            <tr>
              <th className="w-10 px-6 py-4"></th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Receipt Info & PO</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Supplier Name</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Invoice #</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Batch Count</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Received By</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Total Amount</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoadingState ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-40 mx-auto"></div></td>
                  <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-100 rounded w-20 mx-auto"></div></td>
                  <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-100 rounded w-8 mx-auto"></div></td>
                  <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-100 rounded w-16 mx-auto"></div></td>
                  <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-100 rounded w-20 mx-auto"></div></td>
                  <td className="px-6 py-4 text-right"><div className="h-8 bg-slate-100 rounded w-16 ml-auto"></div></td>
                </tr>
              ))
            ) : grns.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                      <Receipt size={24} className="text-slate-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">No goods receipts found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusted filters or receive new stock.</p>
                  </div>
                </td>
              </tr>
            ) : (
              grns.map((grn) => {
                const isExpanded = expandedRows.has(grn.id);
                return (
                  <React.Fragment key={grn.id}>
                    <tr 
                      className={`group cursor-pointer transition-all duration-150 ${isExpanded ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}`}
                      onClick={() => toggleRow(grn.id)}
                    >
                      <td className="px-6 py-4 text-center">
                        <ChevronLeft size={16} className={`text-slate-400 transition-transform duration-200 ${isExpanded ? '-rotate-90' : ''}`} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-700">{grn.received_date}</span>
                          <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mt-0.5">
                            {grn.purchase_order?.po_number || `PO #${grn.purchase_order_id}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Truck size={12} className="text-slate-400" />
                          <span className="text-sm font-semibold text-slate-600">{grn.purchase_order?.supplier?.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-medium text-slate-600 font-mono">{grn.invoice_number || '---'}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{grn.items?.length || 0} Batches</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                            <User size={10} className="text-slate-400" />
                          </div>
                          <span className="text-sm font-medium text-slate-600">{grn.received_by || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-black text-slate-900">৳{parseFloat(grn.total_amount).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => { e.stopPropagation(); onEdit(grn); }}
                            className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit GRN"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, grn)}
                            disabled={isDeleting}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete & Reverse Stock"
                          >
                            <Trash2 size={15} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleRow(grn.id); }} 
                            className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'text-blue-600 bg-blue-100' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
                            title="View Items"
                          >
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Items Breakdown */}
                    {isExpanded && (
                      <tr>
                        <td colSpan="8" className="px-6 pb-6 pt-0 bg-blue-50/10">
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden mt-2"
                          >
                            <table className="w-full text-left">
                              <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Medicine</th>
                                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Batch #</th>
                                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Expiry</th>
                                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Qty Rec.</th>
                                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Unit Cost</th>
                                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {grn.items?.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3">
                                      <span className="text-xs font-bold text-slate-700">{item.medicine_name}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{item.batch_number}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <span className="text-xs font-medium text-slate-500">{item.expiry_date}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <span className="text-xs font-bold text-slate-600">{item.qty_boxes_received} <span className="text-[9px] text-slate-400 uppercase font-medium">Boxes</span></span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <span className="text-xs font-semibold text-slate-500">৳{parseFloat(item.unit_cost).toFixed(2)}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <span className="text-xs font-bold text-slate-700">৳{parseFloat(item.subtotal).toLocaleString()}</span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Showing {grns.length} receipts</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-slate-200 hover:bg-white text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-bold text-slate-600 px-3">Page {meta.current_page || 1} of {meta.last_page || 1}</span>
          <button
            onClick={() => setPage(p => Math.min(p + 1, meta.last_page || 1))}
            disabled={page >= (meta.last_page || 1)}
            className="p-2 rounded-lg border border-slate-200 hover:bg-white text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GRNTable;
