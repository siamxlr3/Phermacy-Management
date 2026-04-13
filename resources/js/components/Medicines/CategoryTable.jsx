import React, { useState, useEffect } from 'react';
import { useGetCategoriesQuery, useDeleteCategoryMutation } from '../../store/api/medicineApi';
import { Search, Plus, Pencil, Trash2, Folder, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import CategoryForm from './CategoryForm';

const EmptyState = ({ onAdd }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
      <Folder size={24} className="text-slate-400" />
    </div>
    <h3 className="text-base font-semibold text-slate-700 mb-1">No categories found</h3>
    <p className="text-sm text-slate-400 mb-5 max-w-xs">
      Organize your medicine inventory by creating proper categories (e.g., Tablets, Syrups, Injections).
    </p>
    <button
      onClick={onAdd}
      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-emerald-200"
    >
      <Plus size={15} /> Add First Category
    </button>
  </div>
);

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-md w-32"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-md w-48"></div></td>
    <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-full w-20 mx-auto"></div></td>
    <td className="px-6 py-4"><div className="h-7 bg-slate-100 rounded-lg w-12 ml-auto"></div></td>
  </tr>
);

const CategoryTable = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, isLoading, isFetching } = useGetCategoriesQuery({ page, perPage, search: debouncedSearch });
  const [deleteCategory] = useDeleteCategoryMutation();

  const handleDelete = async (id) => {
    if (confirm('Delete this category? This action cannot be undone.')) {
      try {
        await deleteCategory(id).unwrap();
        toast.success('Category deleted');
      } catch (err) {
        toast.error(err?.data?.message || 'Failed to delete');
      }
    }
  };

  const handleEdit = (cat) => { setEditingCategory(cat); setIsFormOpen(true); };
  const handleAdd = () => { setEditingCategory(null); setIsFormOpen(true); };

  const categories = data?.data || [];
  const meta = data?.meta || {};
  const isLoadingState = isLoading || isFetching;

  return (
    <div className="flex gap-6 h-full min-h-0">
      <div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col min-h-0">
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Categories</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isLoadingState ? '...' : `${meta.total || categories.length} categorized groups`}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 focus:outline-none transition-all w-48 placeholder:text-slate-400"
              />
            </div>
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-lg transition-all duration-150 shadow-sm shadow-emerald-200"
            >
              <Plus size={15} /> Add Category
            </button>
          </div>
        </div>

        <div className="shrink-0 overflow-x-auto border-b border-slate-100 bg-slate-50/70">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 w-1/4">Name</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 w-2/5">Description</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 text-center w-1/6">Status</th>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 text-right w-1/6">Actions</th>
              </tr>
            </thead>
          </table>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
          {categories.length === 0 && !isLoadingState ? (
            <EmptyState onAdd={handleAdd} />
          ) : (
            <table className="w-full text-left">
              <tbody className="divide-y divide-slate-50">
                {isLoadingState
                  ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                  : categories.map((cat) => (
                    <tr key={cat.id} className="group hover:bg-slate-50/50 transition-colors duration-100">
                      <td className="px-6 py-4 w-1/4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <Folder size={14} />
                          </div>
                          <span className="text-sm font-semibold text-slate-800">{cat.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 w-2/5">
                        <span className="text-sm text-slate-500 line-clamp-1">{cat.description || '—'}</span>
                      </td>
                      <td className="px-6 py-4 text-center w-1/6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${
                          cat.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cat.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {cat.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right w-1/6">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <button onClick={() => handleEdit(cat)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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

        {categories.length > 0 && (
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
            className="w-[380px] shrink-0 overflow-y-auto min-h-0 custom-scrollbar"
          >
            <CategoryForm initialData={editingCategory} onClose={() => setIsFormOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoryTable;
