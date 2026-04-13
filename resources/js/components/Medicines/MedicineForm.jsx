import React, { useState, useEffect } from 'react';
import { 
  useAddMedicineMutation, 
  useUpdateMedicineMutation,
  useGetActiveCategoriesQuery,
  useGetActiveManufacturersQuery
} from '../../store/api/medicineApi';
import { X, Loader2, Pill } from 'lucide-react';
import toast from 'react-hot-toast';

const MedicineForm = ({ initialData, onClose }) => {
  const [addMedicine, { isLoading: isAdding }] = useAddMedicineMutation();
  const [updateMedicine, { isLoading: isUpdating }] = useUpdateMedicineMutation();
  
  const { data: catData, isLoading: catLoading } = useGetActiveCategoriesQuery();
  const { data: manData, isLoading: manLoading } = useGetActiveManufacturersQuery();
  
  const categories = catData?.data || [];
  const manufacturers = manData?.data || [];

  const [formData, setFormData] = useState({ 
    name: '', generic_name: '', category_id: '', manufacturer_id: '',
    tablets_per_strip: '', strips_per_box: '', sale_unit: 'Tablet',
    price_per_tablet: '', cost_price: '', reorder_level: 10, status: 'Active'
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({ 
        name: initialData.name, 
        generic_name: initialData.generic_name || '', 
        category_id: initialData.category_id || '', 
        manufacturer_id: initialData.manufacturer_id || '',
        tablets_per_strip: initialData.tablets_per_strip || '', 
        strips_per_box: initialData.strips_per_box || '', 
        sale_unit: initialData.sale_unit || 'Tablet',
        price_per_tablet: initialData.price_per_tablet || '', 
        cost_price: initialData.cost_price || '', 
        reorder_level: initialData.reorder_level ?? 10, 
        status: initialData.status 
      });
    } else {
      setFormData({ 
        name: '', generic_name: '', category_id: '', manufacturer_id: '',
        tablets_per_strip: '', strips_per_box: '', sale_unit: 'Tablet',
        price_per_tablet: '', cost_price: '', reorder_level: 10, status: 'Active' 
      });
    }
    setErrors({});
  }, [initialData]);

  const validate = () => {
    const e = {};
    if (!formData.name.trim()) e.name = 'Medicine name is required';
    if (!formData.category_id) e.category_id = 'Category is required';
    if (!formData.manufacturer_id) e.manufacturer_id = 'Manufacturer is required';
    if (!formData.price_per_tablet || formData.price_per_tablet <= 0) e.price_per_tablet = 'Valid price required';
    if (!formData.cost_price || formData.cost_price <= 0) e.cost_price = 'Valid cost required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    // Cleanup empty numeric strings to avoid backend validation errors on nullables
    const payload = { ...formData };
    if (payload.tablets_per_strip === '') payload.tablets_per_strip = null;
    if (payload.strips_per_box === '') payload.strips_per_box = null;

    try {
      if (initialData) {
        await updateMedicine({ id: initialData.id, ...payload }).unwrap();
        toast.success('Medicine updated');
      } else {
        await addMedicine(payload).unwrap();
        toast.success('Medicine created');
      }
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Something went wrong');
      if (err?.data?.errors) setErrors(err.data.errors);
    }
  };

  const isLoading = isAdding || isUpdating;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
            <Pill size={15} className="text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {initialData ? 'Edit Medicine' : 'New Medicine'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {initialData ? 'Update item details' : 'Add product to inventory'}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Core Info */}
        <div className="space-y-4">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Core Info</h4>
          
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Medicine Name</label>
            <input type="text" placeholder="e.g. Paracetamol 500mg" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl transition-all focus:outline-none focus:ring-2 ${errors.name ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400' : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-400 hover:border-slate-300'} placeholder:text-slate-300`} />
            {errors.name && <p className="text-xs text-red-500 mt-1.5">⚠ {errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Generic Name</label>
            <input type="text" placeholder="Optional" value={formData.generic_name} onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
              className={`w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 hover:border-slate-300 placeholder:text-slate-300`} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Category</label>
              <select value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl transition-all focus:outline-none focus:ring-2 ${errors.category_id ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400' : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-400 hover:border-slate-300'}`}>
                <option value="">Select Category</option>
                {!catLoading && categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.category_id && <p className="text-xs text-red-500 mt-1.5">⚠ required</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Manufacturer</label>
              <select value={formData.manufacturer_id} onChange={(e) => setFormData({ ...formData, manufacturer_id: e.target.value })}
                className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl transition-all focus:outline-none focus:ring-2 ${errors.manufacturer_id ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400' : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-400 hover:border-slate-300'}`}>
                <option value="">Select Manufacturer</option>
                {!manLoading && manufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              {errors.manufacturer_id && <p className="text-xs text-red-500 mt-1.5">⚠ required</p>}
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-4 pt-2">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Pricing & Logistics</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Cost Price</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input type="number" step="0.01" placeholder="0.00" value={formData.cost_price} onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  className={`w-full pl-7 pr-3.5 py-2.5 text-sm bg-white border rounded-xl transition-all focus:outline-none focus:ring-2 ${errors.cost_price ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400' : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-400 hover:border-slate-300'}`} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Sale Price</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input type="number" step="0.01" placeholder="0.00" value={formData.price_per_tablet} onChange={(e) => setFormData({ ...formData, price_per_tablet: e.target.value })}
                  className={`w-full pl-7 pr-3.5 py-2.5 text-sm bg-white border rounded-xl transition-all focus:outline-none focus:ring-2 ${errors.price_per_tablet ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400' : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-400 hover:border-slate-300'}`} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
             <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Sale Unit</label>
              <select value={formData.sale_unit} onChange={(e) => setFormData({ ...formData, sale_unit: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400">
                <option value="Tablet">Tablet</option>
                <option value="Strip">Strip</option>
                <option value="Bottle">Bottle</option>
                <option value="Box">Box</option>
                <option value="Tube">Tube</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Tabs/Strip</label>
              <input type="number" placeholder="10" value={formData.tablets_per_strip} onChange={(e) => setFormData({ ...formData, tablets_per_strip: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 placeholder:text-slate-300" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Strips/Box</label>
              <input type="number" placeholder="10" value={formData.strips_per_box} onChange={(e) => setFormData({ ...formData, strips_per_box: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 placeholder:text-slate-300" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Reorder Level</label>
              <input type="number" placeholder="10" value={formData.reorder_level} onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 placeholder:text-slate-300" />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-slate-600 mb-2">Status</label>
          <div className="flex gap-2">
            {['Active', 'Inactive'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFormData({ ...formData, status: s })}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-150 ${
                  formData.status === s
                    ? s === 'Active'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm'
                      : 'bg-slate-100 border-slate-300 text-slate-600 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${formData.status === s ? (s === 'Active' ? 'bg-emerald-500' : 'bg-slate-400') : 'bg-slate-200'}`} />
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 mt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-xl transition-all duration-150 shadow-sm shadow-emerald-200/80 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading && <Loader2 size={15} className="animate-spin" />}
            {initialData ? 'Save Changes' : 'Add Medicine'}
          </button>
          <button type="button" onClick={onClose} className="w-full mt-2 py-2 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default MedicineForm;
