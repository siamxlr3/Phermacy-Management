import React, { useState, useEffect } from 'react';
import { useGetAddressesQuery, useDeleteAddressMutation } from '../../store/api/settingApi';
import { Search, Plus, Pencil, Trash2, MapPin, Phone, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import AddressForm from './AddressForm';

const EmptyState = ({ onAdd }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
      <MapPin size={24} className="text-slate-400" />
    </div>
    <h3 className="text-base font-semibold text-slate-700 mb-1">No branches found</h3>
    <p className="text-sm text-slate-400 mb-5 max-w-xs">
      Add your pharmacy's branch address and contact information to get started.
    </p>
    <button
      onClick={onAdd}
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-blue-200"
    >
      <Plus size={15} /> Add First Branch
    </button>
  </div>
);

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-5">
      <div className="h-3.5 bg-slate-100 rounded w-32 mb-2"></div>
      <div className="h-3 bg-slate-100 rounded w-44"></div>
    </td>
    <td className="px-6 py-5"><div className="h-3.5 bg-slate-100 rounded w-48"></div></td>
    <td className="px-6 py-5"><div className="h-6 bg-slate-100 rounded-full w-20 mx-auto"></div></td>
    <td className="px-6 py-5"><div className="h-7 bg-slate-100 rounded-lg w-12 ml-auto"></div></td>
  </tr>
);

const AddressTable = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, isLoading, isFetching } = useGetAddressesQuery({ page, perPage, search: debouncedSearch });
  const [deleteAddress] = useDeleteAddressMutation();

  const handleDelete = async (id) => {
    if (confirm('Delete this address? This action cannot be undone.')) {
      try {
        await deleteAddress(id).unwrap();
        toast.success('Address deleted');
      } catch (err) {
        toast.error(err?.data?.message || 'Failed to delete');
      }
    }
  };

  const handleEdit = (address) => { setEditingAddress(address); setIsFormOpen(true); };
  const handleAdd = () => { setEditingAddress(null); setIsFormOpen(true); };

  const addresses = data?.data || [];
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
            <h2 className="text-base font-semibold text-slate-900">Branch Directory</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isLoadingState ? '...' : `${meta.total || 0} branch${(meta.total || 0) !== 1 ? 'es' : ''} registered`}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search branches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:outline-none transition-all w-48 placeholder:text-slate-400"
              />
            </div>
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg transition-all duration-150 shadow-sm shadow-blue-200"
            >
              <Plus size={15} /> Add Branch
            </button>
          </div>
        </div>

        {/* Table Head — pinned */}
        <div className="shrink-0 overflow-x-auto border-b border-slate-100 bg-slate-50/70">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 w-1/4">Branch Name</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 w-1/4">Contact</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 w-1/4">Address</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 text-center w-[15%]">Status</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 text-right w-[10%]">Actions</th>
              </tr>
            </thead>
          </table>
        </div>

        {/* Scrollable Table Body */}
        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
          {addresses.length === 0 && !isLoadingState ? (
            <EmptyState onAdd={handleAdd} />
          ) : (
            <table className="w-full text-left">
              <tbody className="divide-y divide-slate-50">
                {isLoadingState
                  ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                  : addresses.map((addr) => (
                    <tr key={addr.id} className="group hover:bg-slate-50/50 transition-colors duration-100">
                      {/* Name */}
                      <td className="px-6 py-4 w-1/4">
                        <span className="text-sm font-bold text-slate-900">{addr.name}</span>
                      </td>
                      {/* Contact */}
                      <td className="px-6 py-4 w-1/4">
                        <div className="flex flex-col gap-1.5">
                          {addr.phone && (
                            <span className="flex items-center gap-2 text-sm text-slate-700">
                              <Phone size={12} className="text-slate-400 shrink-0" />
                              <span className="font-medium">{addr.phone}</span>
                            </span>
                          )}
                          {addr.email && (
                            <span className="flex items-center gap-2 text-xs text-slate-500">
                              <Mail size={12} className="text-slate-400 shrink-0" />
                              {addr.email}
                            </span>
                          )}
                          {!addr.phone && !addr.email && (
                            <span className="text-xs text-slate-300 italic">No contact info</span>
                          )}
                        </div>
                      </td>
                      {/* Address */}
                      <td className="px-6 py-4 w-1/4">
                        <div className="flex items-start gap-2">
                          <MapPin size={13} className="text-blue-400 mt-0.5 shrink-0" />
                          <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed">{addr.address || '—'}</p>
                        </div>
                      </td>
                      {/* Status */}
                      <td className="px-6 py-4 text-center w-[15%]">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${
                          addr.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${addr.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {addr.status}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="px-6 py-4 text-right w-[10%]">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <button onClick={() => handleEdit(addr)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(addr.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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
        {addresses.length > 0 && (
          <div className="shrink-0 flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50/40">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Show</span>
              <select
                value={perPage}
                onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-600 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                {[5, 10, 20].map(n => <option key={n} value={n}>{n}</option>)}
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
            className="w-[400px] shrink-0 overflow-y-auto min-h-0 custom-scrollbar"
          >
            <AddressForm initialData={editingAddress} onClose={() => setIsFormOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AddressTable;
