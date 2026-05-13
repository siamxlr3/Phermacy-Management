import React, { useState, useEffect, useRef } from 'react';
import { 
  useGetMedicinesQuery, 
  useDeleteMedicineMutation,
  useImportMedicinesMutation 
} from '../../store/api/medicineApi';
import { 
  Search, Plus, Pencil, Trash2, Pill, ChevronLeft, ChevronRight, 
  Boxes, Droplets, Info, ExternalLink, Activity, Factory, FileUp, Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import MedicineForm from './MedicineForm';
import { useLanguage } from '../../language/GlobalTranslate.jsx';

const getStockStyle = (stock, reorderLevel = 10) => {
  if (stock <= 0) return 'bg-red-50 text-red-600 border-red-100';
  if (stock <= reorderLevel) return 'bg-amber-50 text-amber-600 border-amber-100';
  return 'bg-emerald-50 text-emerald-600 border-emerald-100';
};

const MedicineTable = () => {
  const { translations } = useLanguage();
  const fileInputRef = useRef(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, isLoading, isFetching } = useGetMedicinesQuery({ 
    page, 
    perPage, 
    search: debouncedSearch,
    status: statusFilter
  });
  
  const [deleteMedicine] = useDeleteMedicineMutation();
  const [importMedicines, { isLoading: isImporting }] = useImportMedicinesMutation();

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this medicine?")) {
      try {
        await deleteMedicine(id).unwrap();
        toast.success("Medicine deleted successfully");
      } catch (err) {
        toast.error("Failed to delete medicine");
      }
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await importMedicines(formData).unwrap();
      toast.success('Medicines imported successfully!');
      e.target.value = ''; 
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to import medicines.');
    }
  };

  const handleEdit = (med) => { setEditingMedicine(med); setIsFormOpen(true); };
  const handleAdd = () => { setEditingMedicine(null); setIsFormOpen(true); };

  const medicines = data?.data || [];
  const meta = data?.meta || {};
  const isLoadingState = isLoading || isFetching;

  return (
    <div className="flex gap-6 h-full min-h-0 w-full min-w-0 overflow-hidden">
      <div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
        {/* Header Area */}
        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-100 gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Medicine Catalog</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isLoadingState ? 'Updating...' : `${meta.total || medicines.length} medicines registered`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 focus:outline-none transition-all text-slate-600 outline-none"
            >
              <option value="">All Status</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 w-48 placeholder:text-slate-400 transition-all outline-none"
              />
            </div>

            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls, .csv" />
            <button
                onClick={handleImportClick}
                disabled={isImporting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold rounded-lg transition-all disabled:opacity-60"
            >
                {isImporting ? <Loader2 size={15} className="animate-spin" /> : <FileUp size={15} />}
                {isImporting ? '...' : 'Import'}
            </button>

            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-all shadow-sm"
            >
              <Plus size={15} /> Add Medicine
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-auto min-h-0 custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead className="sticky top-0 bg-white z-20 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 w-[20%]">Medicine Information</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 w-[10%]">Classification</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 w-[15%]">Category & Manufacturer</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 w-[10%]">Unit Config</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 w-[15%]">Packaging</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 w-[10%] text-right">Pricing (৳)</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-amber-500 w-[10%] text-right bg-amber-50/20">Cost Price (৳)</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 w-[8%] text-center">Stock</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 w-[10%] text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 w-[100px] text-right sticky right-0 bg-slate-50/50">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoadingState ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="10" className="px-6 py-4"><div className="h-10 bg-slate-100 rounded-lg w-full"></div></td>
                  </tr>
                ))
              ) : medicines.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-20 text-center">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No medicines found</p>
                  </td>
                </tr>
              ) : (
                medicines.map((med) => (
                  <tr key={med.id} className="group hover:bg-slate-50/50 transition-colors">
                    {/* Info */}
                    <td className="px-6 py-4 w-[20%]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                          <Pill size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate uppercase">{med.medicine_name}</p>
                          <p className="text-[11px] text-slate-400 italic font-medium truncate">{med.generic_name || 'No generic name'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Classification */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200 uppercase w-fit">
                          {med.dosage_form}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500">{med.strength || 'N/A'}</span>
                      </div>
                    </td>

                    {/* Cat/Man */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-slate-700 truncate">{med.category}</span>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                           <Factory size={10} /> {med.manufacturer}
                        </div>
                      </div>
                    </td>

                    {/* Units */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-bold text-slate-600">Type: {med.unit_type}</span>
                        <span className="text-[10px] font-bold text-blue-500 uppercase">{med.sale_unit_label}</span>
                      </div>
                    </td>

                    {/* Packaging */}
                    <td className="px-6 py-4">
                       <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                             <Boxes size={12} className="text-slate-300" />
                             {med.tablets_per_strip ? `${med.tablets_per_strip} Tabs / Strip` : 'N/A'}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 pl-5">
                             {med.strips_per_box ? `${med.strips_per_box} Strips / Box` : ''}
                             {med.package_size ? ` (${med.package_size})` : ''}
                          </div>
                       </div>
                    </td>

                    {/* Pricing */}
                    <td className="px-6 py-4 text-right">
                       <div className="inline-grid grid-cols-2 gap-x-4 gap-y-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase text-left">Unit:</span>
                          <span className="text-xs font-black text-emerald-600">৳{parseFloat(med.price_per_unit || 0).toFixed(2)}</span>
                          
                          {med.price_per_stripe > 0 && (
                             <>
                                <span className="text-[10px] font-black text-slate-400 uppercase text-left">Strip:</span>
                                <span className="text-xs font-black text-indigo-600">৳{parseFloat(med.price_per_stripe).toFixed(2)}</span>
                             </>
                          )}

                          {med.price_per_box > 0 && (
                             <>
                                <span className="text-[10px] font-black text-slate-400 uppercase text-left">Box:</span>
                                <span className="text-xs font-black text-blue-600">৳{parseFloat(med.price_per_box).toFixed(2)}</span>
                             </>
                          )}

                          <span className="text-[10px] font-black text-slate-400 uppercase text-left">MRP:</span>
                          <span className="text-xs font-black text-rose-600">৳{parseFloat(med.mrp || 0).toFixed(2)}</span>
                       </div>
                    </td>

                    {/* Cost Price */}
                    <td className="px-6 py-4 text-right bg-amber-50/30">
                       <div className="flex flex-col items-end">
                          <span className="text-xs font-black text-amber-600">৳{parseFloat(med.cost_price || 0).toFixed(2)}</span>
                          <span className="text-[9px] font-bold text-amber-400 uppercase tracking-tighter">Purchase Cost</span>
                       </div>
                    </td>

                    {/* Stock */}
                    <td className="px-6 py-4 text-center">
                       <div className="flex flex-col items-center gap-1">
                          <span className={`px-3 py-1 rounded-full text-xs font-black border ${getStockStyle(med.stock || 0, med.reorder_level)}`}>
                             {med.stock || 0}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Min: {med.reorder_level}</span>
                       </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center">
                       <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-widest ${
                         med.is_active 
                           ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                           : 'bg-slate-50 text-slate-400 border-slate-200'
                       }`}>
                         <Activity size={10} className={med.is_active ? 'animate-pulse' : ''} />
                         {med.is_active ? 'Active' : 'Inactive'}
                       </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right sticky right-0 bg-white group-hover:bg-slate-50 transition-colors">
                       <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleEdit(med)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(med.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={14} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Rows per page:</span>
            <select
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
              className="bg-white border border-slate-200 text-xs font-bold text-slate-600 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-emerald-500/10 outline-none"
            >
              {[10, 25, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setPage(p => Math.max(p - 1, 1))} 
                disabled={page === 1} 
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-medium text-slate-600 px-2">
                PAGE <span className="text-emerald-600 font-bold">{meta.current_page || 1}</span> OF <span className="text-emerald-600 font-bold">{meta.last_page || 1}</span>
              </span>
              <button 
                onClick={() => setPage(p => Math.min(p + 1, meta.last_page || 1))} 
                disabled={page >= (meta.last_page || 1)} 
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10"
            >
              <MedicineForm 
                initialData={editingMedicine} 
                onClose={() => setIsFormOpen(false)} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MedicineTable;
