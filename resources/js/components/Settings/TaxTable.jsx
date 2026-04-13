import React, { useState, useEffect } from 'react';
import { useGetTaxesQuery, useDeleteTaxMutation } from '../../store/api/settingApi';
import { Search, Plus, Pencil, Trash2, Percent, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import TaxForm from './TaxForm';

const EmptyState = ({ onAdd }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
      <Percent size={24} className="text-slate-400" />
    </div>
    <h3 className="text-base font-semibold text-slate-700 mb-1">No taxes configured</h3>
    <p className="text-sm text-slate-400 mb-5 max-w-xs">
      Get started by adding your first tax rule. Taxes will appear in your POS and invoicing.
    </p>
    <button
      onClick={onAdd}
      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-emerald-200"
    >
      <Plus size={15} /> Add First Tax
    </button>
  </div>
);

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-md w-28"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-md w-14 mx-auto"></div></td>
    <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-full w-20 mx-auto"></div></td>
    <td className="px-6 py-4"><div className="h-7 bg-slate-100 rounded-lg w-12 ml-auto"></div></td>
  </tr>
);

const TaxTable = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTax, setEditingTax] = useState(null);

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, isLoading, isFetching } = useGetTaxesQuery({ page, perPage, search: debouncedSearch });
  const [deleteTax] = useDeleteTaxMutation();

  const handleDelete = async (id) => {
    if (confirm('Delete this tax? This action cannot be undone.')) {
      try {
        await deleteTax(id).unwrap();
        toast.success('Tax deleted');
      } catch (err) {
        toast.error(err?.data?.message || 'Failed to delete');
      }
    }
  };

  const handleEdit = (tax) => { setEditingTax(tax); setIsFormOpen(true); };
  const handleAdd = () => { setEditingTax(null); setIsFormOpen(true); };

  const taxes = data?.data || [];
  const meta = data?.meta || {};
  const isLoadingState = isLoading || isFetching;

  return (
    // Outer container: fills all available height, flex row
    <div className="flex gap-6 h-full min-h-0">

      {/* TABLE CARD — fills height, internal scroll on body */}
      <div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col min-h-0">

        {/* Card Header — pinned */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Tax Rules</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isLoadingState ? '...' : `${meta.total || 0} rule${(meta.total || 0) !== 1 ? 's' : ''} configured`}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search taxes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 focus:outline-none transition-all w-48 placeholder:text-slate-400"
              />
            </div>
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-lg transition-all duration-150 shadow-sm shadow-emerald-200"
            >
              <Plus size={15} /> Add Tax
            </button>
          </div>
        </div>

        {/* Table Head — pinned */}
        <div className="shrink-0 overflow-x-auto border-b border-slate-100 bg-slate-50/70">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 w-1/3">Tax Name</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 text-center w-1/4">Rate</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 text-center w-1/4">Status</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 text-right w-1/6">Actions</th>
              </tr>
            </thead>
          </table>
        </div>

        {/* Scrollable Table Body */}
        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
          {taxes.length === 0 && !isLoadingState ? (
            <EmptyState onAdd={handleAdd} />
          ) : (
            <table className="w-full text-left">
              <tbody className="divide-y divide-slate-50">
                {isLoadingState
                  ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                  : taxes.map((tax) => (
                    <tr key={tax.id} className="group hover:bg-slate-50/50 transition-colors duration-100">
                      <td className="px-6 py-4 w-1/3">
                        <span className="text-sm font-semibold text-slate-800">{tax.name}</span>
                      </td>
                      <td className="px-6 py-4 text-center w-1/4">
                        <span className="text-sm font-bold text-slate-700">
                          {tax.rate}<span className="text-slate-400 font-normal text-xs ml-0.5">%</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center w-1/4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${
                          tax.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${tax.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {tax.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right w-1/6">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <button onClick={() => handleEdit(tax)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(tax.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer — pinned at bottom */}
        {taxes.length > 0 && (
          <div className="shrink-0 flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50/40">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Show</span>
              <select
                value={perPage}
                onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-600 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="text-xs text-slate-400">per page</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-medium text-slate-600 px-2">{meta.current_page || 1} / {meta.last_page || 1}</span>
              <button onClick={() => setPage(p => Math.min(p + 1, meta.last_page || 1))} disabled={page >= (meta.last_page || 1)} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SLIDE-IN FORM */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-[380px] shrink-0 overflow-y-auto min-h-0 custom-scrollbar"
          >
            <TaxForm initialData={editingTax} onClose={() => setIsFormOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaxTable;
