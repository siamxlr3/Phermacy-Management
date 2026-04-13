import React, { useState, useEffect } from 'react';
import { useGetMedicinesQuery, useDeleteMedicineMutation } from '../../store/api/medicineApi';
import { Search, Plus, Pencil, Trash2, Pill, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import MedicineForm from './MedicineForm';

const getStatusStyle = (stock, reorderLevel = 10) => {
  if (stock <= 0) return 'bg-red-50 text-red-600 border-red-100';
  if (stock <= reorderLevel) return 'bg-amber-50 text-amber-600 border-amber-100';
  return 'bg-emerald-50 text-emerald-600 border-emerald-100';
};

const getStatusLabel = (stock, reorderLevel = 10) => {
  if (stock <= 0) return 'Out of Stock';
  if (stock <= reorderLevel) return 'Low Stock';
  return 'In Stock';
};

const EmptyState = ({ onAdd }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
      <Pill size={24} className="text-slate-400" />
    </div>
    <h3 className="text-base font-semibold text-slate-700 mb-1">No medicines found</h3>
    <p className="text-sm text-slate-400 mb-5 max-w-xs">
      Build your inventory by adding pharmaceuticals, products, and medical supplies.
    </p>
    <button
      onClick={onAdd}
      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-emerald-200"
    >
      <Plus size={15} /> Add First Medicine
    </button>
  </div>
);

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4">
      <div className="flex gap-3">
         <div className="w-9 h-9 bg-slate-100 rounded-lg shrink-0"></div>
         <div className="flex flex-col gap-1.5"><div className="w-32 h-3.5 bg-slate-100 rounded"></div><div className="w-16 h-3 bg-slate-100 rounded"></div></div>
      </div>
    </td>
    <td className="px-6 py-4"><div className="h-3.5 bg-slate-100 rounded w-24"></div></td>
    <td className="px-6 py-4"><div className="h-5 bg-slate-100 rounded-full w-20"></div></td>
    <td className="px-6 py-4">
      <div className="flex flex-col gap-1.5">
        <div className="h-3.5 bg-slate-100 rounded w-16 ml-auto"></div>
        <div className="h-3 bg-slate-100 rounded w-12 ml-auto"></div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="flex flex-col gap-1.5">
        <div className="h-3 bg-slate-100 rounded w-16 mx-auto"></div>
        <div className="h-3 bg-slate-100 rounded w-12 mx-auto"></div>
      </div>
    </td>
    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-md w-8 mx-auto"></div></td>
    <td className="px-6 py-4"><div className="h-5 bg-slate-100 rounded-full w-20 mx-auto"></div></td>
    <td className="px-6 py-4"><div className="h-7 bg-slate-100 rounded-lg w-12 ml-auto"></div></td>
  </tr>
);

const MedicineTable = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, isLoading, isFetching } = useGetMedicinesQuery({ page, perPage, search: debouncedSearch });
  const [deleteMedicine] = useDeleteMedicineMutation();

  const handleDelete = async (id) => {
    if (confirm('Delete this medicine? This action cannot be undone.')) {
      try {
        await deleteMedicine(id).unwrap();
        toast.success('Medicine deleted');
      } catch (err) {
        toast.error(err?.data?.message || 'Failed to delete');
      }
    }
  };

  const handleEdit = (med) => { setEditingMedicine(med); setIsFormOpen(true); };
  const handleAdd = () => { setEditingMedicine(null); setIsFormOpen(true); };

  const medicines = data?.data || [];
  const meta = data?.meta || {};
  const isLoadingState = isLoading || isFetching;

  return (
    <div className="flex gap-6 h-full min-h-0">
      <div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col min-h-0">
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Inventory Management</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isLoadingState ? '...' : `${meta.total || medicines.length} medicines in catalog`}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 focus:outline-none transition-all w-56 placeholder:text-slate-400"
              />
            </div>
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-lg transition-all duration-150 shadow-sm shadow-emerald-200"
            >
              <Plus size={15} /> Add Medicine
            </button>
          </div>
        </div>

        <div className="shrink-0 overflow-x-auto border-b border-slate-100 bg-slate-50/70">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 w-[22%]">Medicine Info</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 w-[12%]">Category</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 w-[14%]">Manufacturer</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 w-[14%] text-right">Pricing & Unit</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 w-[14%] text-center">Packaging</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 w-[8%] text-center">Reorder</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 w-[12%] text-center">Status</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 w-[8%] text-right">Actions</th>
              </tr>
            </thead>
          </table>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
          {medicines.length === 0 && !isLoadingState ? (
            <EmptyState onAdd={handleAdd} />
          ) : (
            <table className="w-full text-left">
              <tbody className="divide-y divide-slate-50">
                {isLoadingState
                  ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                  : medicines.map((med) => (
                    <tr key={med.id} className="group hover:bg-slate-50/50 transition-colors duration-100">
                    {/* Medicine Info */}
                      <td className="px-6 py-4 w-[22%]">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 font-black text-xs">
                            {med.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-bold text-slate-900 truncate">{med.name}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border uppercase tracking-tighter shrink-0 ${getStatusStyle(med.stock || 0, med.reorder_level)}`}>
                                {getStatusLabel(med.stock || 0, med.reorder_level)}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium truncate italic">{med.generic_name || '—'}</p>
                          </div>
                        </div>
                      </td>
                      {/* Category */}
                      <td className="px-6 py-4 w-[12%]">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-semibold border border-slate-200">
                          {med.category || 'Uncategorized'}
                        </span>
                      </td>
                      {/* Manufacturer */}
                      <td className="px-6 py-4 w-[14%]">
                        <span className="text-xs font-medium text-slate-600 truncate block">{med.manufacturer || '—'}</span>
                      </td>
                      {/* Pricing */}
                      <td className="px-6 py-4 text-right w-[14%]">
                        <div className="flex flex-col gap-1 items-end">
                           <span className="text-[9px] font-black uppercase text-indigo-600 tracking-wider bg-indigo-50 px-2 py-0.5 rounded-full mb-1 border border-indigo-100/50">
                            {med.sale_unit || 'Unit'}
                          </span>
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sale</span>
                            <span className="text-sm font-bold text-emerald-600">৳{parseFloat(med.price_per_tablet).toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Cost</span>
                            <span className="text-xs font-semibold text-slate-400">৳{parseFloat(med.cost_price).toFixed(2)}</span>
                          </div>
                        </div>
                      </td>
                      {/* Packaging */}
                      <td className="px-6 py-4 text-center w-[14%]">
                        <div className="flex flex-col gap-0.5 items-center">
                          <span className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                            {med.tablets_per_strip ? `${med.tablets_per_strip} Tabs/Strip` : '—'}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
                            {med.strips_per_box ? `${med.strips_per_box} Strips/Box` : '—'}
                          </span>
                        </div>
                      </td>
                      {/* Reorder Level */}
                      <td className="px-6 py-4 text-center w-[8%]">
                        <span className="text-xs font-bold text-slate-500">{med.reorder_level}</span>
                      </td>
                      {/* Status */}
                      <td className="px-6 py-4 text-center w-[12%]">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-widest ${
                          med.status === 'Active' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                            : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}>
                          <div className={`w-1 h-1 rounded-full ${med.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                          {med.status || 'Active'}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="px-6 py-4 text-right w-[8%]">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <button onClick={() => handleEdit(med)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(med.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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

        {medicines.length > 0 && (
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
              <span className="text-xs font-medium text-slate-600 px-2">Page {meta.current_page || 1}</span>
              <button onClick={() => setPage(p => Math.min(p + 1, meta.last_page || 1))} disabled={page >= (meta.last_page || 1)} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-[440px] shrink-0 overflow-y-auto min-h-0 custom-scrollbar pb-6"
          >
            <MedicineForm initialData={editingMedicine} onClose={() => setIsFormOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MedicineTable;
