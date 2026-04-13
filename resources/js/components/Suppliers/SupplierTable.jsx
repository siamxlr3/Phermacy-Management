import React, { useState, useEffect } from 'react';
import { useGetSuppliersQuery, useDeleteSupplierMutation } from '../../store/api/supplierApi';
import { Search, Plus, Pencil, Trash2, Truck, ChevronLeft, ChevronRight, Phone, Mail, User, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import SupplierForm from './SupplierForm';

const EmptyState = ({ onAdd }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
      <Truck size={24} className="text-slate-400" />
    </div>
    <h3 className="text-base font-semibold text-slate-700 mb-1">No suppliers found</h3>
    <p className="text-sm text-slate-400 mb-5 max-w-xs">
      Add the vendors and suppliers you purchase medicines and inventory from.
    </p>
    <button
      onClick={onAdd}
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-blue-200"
    >
      <Plus size={15} /> Add First Supplier
    </button>
  </div>
);

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-md w-32"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-md w-40"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-md w-48"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-md w-10 mx-auto"></div></td>
    <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-full w-20 mx-auto"></div></td>
    <td className="px-6 py-4"><div className="h-7 bg-slate-100 rounded-lg w-12 ml-auto"></div></td>
  </tr>
);

const SupplierTable = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, isLoading, isFetching } = useGetSuppliersQuery({ 
    page, 
    perPage, 
    search: debouncedSearch,
    status: statusFilter
  });
  const [deleteSupplier] = useDeleteSupplierMutation();

  const handleDelete = async (id) => {
    if (confirm('Delete this supplier? This action cannot be undone.')) {
      try {
        await deleteSupplier(id).unwrap();
        toast.success('Supplier deleted');
      } catch (err) {
        toast.error(err?.data?.message || 'Failed to delete');
      }
    }
  };

  const handleEdit = (supplier) => { setEditingSupplier(supplier); setIsFormOpen(true); };
  const handleAdd = () => { setEditingSupplier(null); setIsFormOpen(true); };

  const suppliers = data?.data || [];
  const meta = data?.meta || {};
  const isLoadingState = isLoading || isFetching;

  return (
    <div className="flex gap-6 h-full min-h-0">
      <div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col min-h-0">
        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-100 gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Suppliers</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isLoadingState ? '...' : `${meta.total || suppliers.length} business partners`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:outline-none transition-all text-slate-600 outline-none"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:outline-none transition-all w-48 placeholder:text-slate-400"
              />
            </div>
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg transition-all duration-150 shadow-sm shadow-blue-200"
            >
              <Plus size={15} /> Add Supplier
            </button>
          </div>
        </div>

        <div className="shrink-0 overflow-x-auto border-b border-slate-100 bg-slate-50/70">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 w-[20%]">Supplier Name</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 w-[20%]">Contact Details</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 w-[25%]">Address</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 text-center w-[12%]">Credit Days</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 text-center w-[13%]">Status</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 text-right w-[10%]">Actions</th>
              </tr>
            </thead>
          </table>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
          {suppliers.length === 0 && !isLoadingState ? (
            <EmptyState onAdd={handleAdd} />
          ) : (
            <table className="w-full text-left">
              <tbody className="divide-y divide-slate-50">
                {isLoadingState
                  ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                  : suppliers.map((supplier) => (
                    <tr key={supplier.id} className="group hover:bg-slate-50/50 transition-colors duration-100">
                      <td className="px-6 py-4 w-[20%]">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                            <Truck size={16} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-800 line-clamp-1">{supplier.name}</span>
                            <div className="flex items-center gap-1 text-[11px] text-slate-400">
                              <User size={10} />
                              <span className="line-clamp-1">{supplier.contact_person || 'No contact person'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 w-[20%]">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Phone size={12} className="text-slate-400" />
                            <span>{supplier.phone}</span>
                          </div>
                          {supplier.email && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Mail size={12} className="text-slate-400" />
                              <span className="line-clamp-1">{supplier.email}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 w-[25%]">
                        <div className="flex items-start gap-2">
                           <MapPin size={13} className="text-slate-400 mt-0.5 shrink-0" />
                           <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{supplier.address || '—'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center w-[12%]">
                        <span className="text-sm font-medium text-slate-600">
                          {supplier.credit_days} <span className="text-[10px] text-slate-400 font-normal">days</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center w-[13%]">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${
                          supplier.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${supplier.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {supplier.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right w-[10%]">
                        <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <button onClick={() => handleEdit(supplier)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(supplier.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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

        {suppliers.length > 0 && (
          <div className="shrink-0 flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50/40">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Show</span>
              <select
                value={perPage}
                onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-600 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="text-xs text-slate-400">per page</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setPage(p => Math.max(p - 1, 1))} 
                disabled={page === 1} 
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-medium text-slate-600 px-2">Page {meta.current_page || 1} of {meta.last_page || 1}</span>
              <button 
                onClick={() => setPage(p => Math.min(p + 1, meta.last_page || 1))} 
                disabled={page >= (meta.last_page || 1)} 
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-[420px] shrink-0 overflow-y-auto min-h-0 custom-scrollbar"
          >
            <SupplierForm initialData={editingSupplier} onClose={() => setIsFormOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SupplierTable;
