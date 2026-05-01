import React, { useState, useEffect } from 'react';
import { 
  useAddMedicineMutation, 
  useUpdateMedicineMutation
} from '../../store/api/medicineApi';
import { X, Loader2, Pill, Boxes, Droplets, Tag, Factory } from 'lucide-react';
import toast from 'react-hot-toast';

const DOSAGE_FORMS = {
  GROUP_A: ['Tablet', 'Capsule', 'Suppository', 'Patch'],
  GROUP_B: ['Syrup', 'Suspension', 'Injection', 'Cream', 'Ointment', 'Gel', 'Drops', 'Inhaler', 'Powder', 'Lotion']
};

const MedicineForm = ({ initialData, onClose }) => {
  const [addMedicine, { isLoading: isAdding }] = useAddMedicineMutation();
  const [updateMedicine, { isLoading: isUpdating }] = useUpdateMedicineMutation();

  const initialFormState = { 
    name: '', generic_name: '', category_name: '', manufacturer_name: '',
    dosage_form: 'Tablet', strength: '',
    tablet_per_stripe: '', stripe_per_box: '', price_per_tablet: '', price_per_stripe: '', price_per_box: '',
    volume: '', price: '',
    reorder_level: 10, status: 'Active'
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({ 
        ...initialFormState,
        ...initialData,
        reorder_level: initialData.reorder_level ?? 10,
      });
    } else {
      setFormData(initialFormState);
    }
    setErrors({});
  }, [initialData]);

  const isGroupA = DOSAGE_FORMS.GROUP_A.includes(formData.dosage_form);

  const validate = () => {
    const e = {};
    if (!formData.name.trim()) e.name = 'Medicine name is required';
    if (!formData.category_name.trim()) e.category_name = 'Category name is required';
    if (!formData.manufacturer_name.trim()) e.manufacturer_name = 'Manufacturer name is required';
    if (!formData.dosage_form) e.dosage_form = 'Dosage form is required';

    if (isGroupA) {
      if (!formData.tablet_per_stripe) e.tablet_per_stripe = 'Required';
      if (!formData.stripe_per_box) e.stripe_per_box = 'Required';
      if (!formData.price_per_tablet || formData.price_per_tablet <= 0) e.price_per_tablet = 'Required';
    } else {
      if (!formData.volume) e.volume = 'Volume is required';
      if (!formData.price || formData.price <= 0) e.price = 'Price is required';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    const payload = { ...formData };
    if (isGroupA) {
      payload.volume = null;
      payload.price = null;
    } else {
      payload.tablet_per_stripe = null;
      payload.stripe_per_box = null;
      payload.price_per_tablet = null;
      payload.price_per_stripe = null;
      payload.price_per_box = null;
    }

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

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Core Info */}
        <div className="space-y-4">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Core Info</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-semibold text-slate-600 mb-2">Medicine Name</label>
              <input type="text" placeholder="e.g. Napa" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl transition-all focus:outline-none focus:ring-2 ${errors.name ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400' : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-400 hover:border-slate-300'}`} />
              {errors.name && <p className="text-xs text-red-500 mt-1.5">⚠ {errors.name}</p>}
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-semibold text-slate-600 mb-2">Generic Name</label>
              <input type="text" placeholder="e.g. Paracetamol" value={formData.generic_name} onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 hover:border-slate-300" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Category Name</label>
              <div className="relative">
                 <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                 <input type="text" placeholder="e.g. Fever" value={formData.category_name} onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                   className={`w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border rounded-xl transition-all focus:outline-none focus:ring-2 ${errors.category_name ? 'border-red-300 focus:ring-red-500/20' : 'border-slate-200 focus:ring-emerald-500/20 hover:border-slate-300'}`} />
              </div>
              {errors.category_name && <p className="text-xs text-red-500 mt-1.5">⚠ {errors.category_name}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Manufacturer Name</label>
              <div className="relative">
                <Factory size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                <input type="text" placeholder="e.g. Square" value={formData.manufacturer_name} onChange={(e) => setFormData({ ...formData, manufacturer_name: e.target.value })}
                  className={`w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border rounded-xl transition-all focus:outline-none focus:ring-2 ${errors.manufacturer_name ? 'border-red-300 focus:ring-red-500/20' : 'border-slate-200 focus:ring-emerald-500/20 hover:border-slate-300'}`} />
              </div>
              {errors.manufacturer_name && <p className="text-xs text-red-500 mt-1.5">⚠ {errors.manufacturer_name}</p>}
            </div>
          </div>
        </div>

        {/* Classification */}
        <div className="space-y-4 pt-2">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Classification & Dosage</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className={isGroupA ? '' : 'col-span-2'}>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Dosage Form</label>
              <select value={formData.dosage_form} onChange={(e) => setFormData({ ...formData, dosage_form: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400">
                <optgroup label="Group A (Solid/Patch)">
                  {DOSAGE_FORMS.GROUP_A.map(f => <option key={f} value={f}>{f}</option>)}
                </optgroup>
                <optgroup label="Group B (Liquid/Cream/Others)">
                  {DOSAGE_FORMS.GROUP_B.map(f => <option key={f} value={f}>{f}</option>)}
                </optgroup>
              </select>
            </div>
            {isGroupA && (
              <div className="animate-in fade-in duration-200">
                <label className="block text-xs font-semibold text-slate-600 mb-2">Strength</label>
                <input type="text" placeholder="e.g. 500mg, 250mg/5ml" value={formData.strength} onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 hover:border-slate-300" />
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Pricing Section */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              {isGroupA ? 'Packaging & Group A Pricing' : 'Volume & Group B Pricing'}
            </h4>
            {isGroupA ? <Boxes size={14} className="text-slate-300" /> : <Droplets size={14} className="text-slate-300" />}
          </div>

          {isGroupA ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Tablets per Strip</label>
                  <input type="number" placeholder="10" value={formData.tablet_per_stripe} onChange={(e) => setFormData({ ...formData, tablet_per_stripe: e.target.value })}
                    className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl transition-all ${errors.tablet_per_stripe ? 'border-red-300' : 'border-slate-200'}`} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Stripes per Box</label>
                  <input type="number" placeholder="10" value={formData.stripe_per_box} onChange={(e) => setFormData({ ...formData, stripe_per_box: e.target.value })}
                    className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl transition-all ${errors.stripe_per_box ? 'border-red-300' : 'border-slate-200'}`} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Price/Tablet</label>
                  <input type="number" step="0.01" placeholder="0.00" value={formData.price_per_tablet} onChange={(e) => setFormData({ ...formData, price_per_tablet: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Price/Strip</label>
                  <input type="number" step="0.01" placeholder="0.00" value={formData.price_per_stripe} onChange={(e) => setFormData({ ...formData, price_per_stripe: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Price/Box</label>
                  <input type="number" step="0.01" placeholder="0.00" value={formData.price_per_box} onChange={(e) => setFormData({ ...formData, price_per_box: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl" />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Volume (Unit)</label>
                <input type="text" placeholder="e.g. 100ml" value={formData.volume} onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                  className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl transition-all ${errors.volume ? 'border-red-300' : 'border-slate-200'}`} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Price</label>
                <input type="number" step="0.01" placeholder="0.00" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl transition-all ${errors.price ? 'border-red-300' : 'border-slate-200'}`} />
              </div>
            </div>
          )}
        </div>

        {/* Logistics */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Reorder Level</label>
            <input type="number" value={formData.reorder_level} onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Status</label>
            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 mt-6 flex flex-col gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-emerald-200/50 disabled:opacity-60"
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {initialData ? 'Update Medicine' : 'Create Medicine'}
          </button>
          <button type="button" onClick={onClose} className="w-full py-2 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors">
            Discard Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default MedicineForm;
