import React, { useState, useEffect } from 'react';
import { 
  useAddMedicineMutation, 
  useUpdateMedicineMutation
} from '../../store/api/medicineApi';
import { X, Loader2, Pill, Boxes, Droplets, Tag, Factory, Scale, LayoutGrid, PackageCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../language/GlobalTranslate.jsx';

const DOSAGE_FORMS = [
  'Tablet', 'Capsule', 'Syrup', 'Drops', 'Cream', 'Ointment', 
  'Gel', 'Lotion', 'Suspension', 'Injection', 'Inhaler', 
  'Powder', 'Suppository', 'Patch', 'Sachet'
];

const MedicineForm = ({ initialData, onClose }) => {
  const { translations } = useLanguage();
  const [addMedicine, { isLoading: isAdding }] = useAddMedicineMutation();
  const [updateMedicine, { isLoading: isUpdating }] = useUpdateMedicineMutation();

  const initialFormState = { 
    medicine_name: '', generic_name: '', category: '', manufacturer: '',
    dosage_form: 'Tablet', strength: '',
    unit_type: 'Box', sale_unit_label: 'per Piece',
    tablets_per_strip: '', strips_per_box: '', package_size: '',
    price_per_unit: '', price_per_stripe: '', price_per_box: '',
    mrp: '', cost_price: '', reorder_level: '', is_active: true
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({ 
        ...initialFormState,
        ...initialData,
        is_active: initialData.is_active ?? true,
      });
    } else {
      setFormData(initialFormState);
    }
    setErrors({});
  }, [initialData]);

  const validate = () => {
    const e = {};
    if (!formData.medicine_name.trim()) e.medicine_name = translations.medicine?.name_required || "Medicine name is required";
    if (!formData.category.trim()) e.category = translations.medicine?.category_required || "Category is required";
    if (!formData.manufacturer.trim()) e.manufacturer = translations.medicine?.manuf_required || "Manufacturer is required";
    if (!formData.dosage_form) e.dosage_form = translations.medicine?.dosage_required || "Dosage form is required";
    if (!formData.unit_type) e.unit_type = translations.medicine?.required || "Unit type is required";
    if (!formData.sale_unit_label) e.sale_unit_label = translations.medicine?.required || "Sale unit label is required";
    if (!formData.price_per_unit || formData.price_per_unit <= 0) e.price_per_unit = translations.medicine?.price_required || "Valid price per unit is required";
    if (!formData.mrp || formData.mrp <= 0) e.mrp = translations.medicine?.price_required || "Valid MRP is required";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    try {
      if (initialData) {
        await updateMedicine({ id: initialData.id, ...formData }).unwrap();
        toast.success(translations.medicine?.update_success || "Medicine updated successfully");
      } else {
        await addMedicine(formData).unwrap();
        toast.success(translations.medicine?.create_success || "Medicine added successfully");
      }
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || translations.medicine?.error_generic || "Something went wrong");
      if (err?.data?.errors) setErrors(err.data.errors);
    }
  };

  const isLoading = isAdding || isUpdating;
  const isStripBased = ['Tablet', 'Capsule', 'Suppository', 'Sachet'].includes(formData.dosage_form);

  return (
    <div className="bg-white flex flex-col w-full max-h-[85vh]">
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
            <Pill size={15} className="text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {initialData ? (translations.medicine?.edit_medicine || "Edit Medicine") : (translations.medicine?.new_medicine || "New Medicine")}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {initialData ? (translations.medicine?.update_details || "Update existing details") : (translations.medicine?.add_to_inventory || "Add new item to inventory")}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* Core Info */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
               <LayoutGrid size={12} /> {translations.medicine?.core_info || 'Basic Information'}
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-2">{translations.medicine?.medicine_name || 'Medicine Name'}</label>
                <input type="text" placeholder="e.g. Napa Extend" value={formData.medicine_name} onChange={(e) => setFormData({ ...formData, medicine_name: e.target.value })}
                  className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl transition-all focus:outline-none focus:ring-2 ${errors.medicine_name ? 'border-red-300 focus:ring-red-500/20' : 'border-slate-200 focus:ring-emerald-500/20 hover:border-slate-300'}`} />
                {errors.medicine_name && <p className="text-[10px] text-red-500 mt-1">⚠ {errors.medicine_name}</p>}
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-2">{translations.medicine?.generic_name || 'Generic Name'}</label>
                <input type="text" placeholder="e.g. Paracetamol" value={formData.generic_name} onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">{translations.medicine?.category_name || 'Category'}</label>
                <div className="relative">
                   <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                   <input type="text" placeholder="e.g. Fever" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                     className={`w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 ${errors.category ? 'border-red-300' : 'border-slate-200 focus:ring-emerald-500/20'}`} />
                </div>
                {errors.category && <p className="text-[10px] text-red-500 mt-1">⚠ {errors.category}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">{translations.medicine?.manufacturer_name || 'Manufacturer'}</label>
                <div className="relative">
                  <Factory size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input type="text" placeholder="e.g. Square" value={formData.manufacturer} onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className={`w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 ${errors.manufacturer ? 'border-red-300' : 'border-slate-200 focus:ring-emerald-500/20'}`} />
                </div>
                {errors.manufacturer && <p className="text-[10px] text-red-500 mt-1">⚠ {errors.manufacturer}</p>}
              </div>
            </div>
          </div>

          {/* Form & Unit */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
               <Scale size={12} /> {translations.medicine?.classification_dosage || 'Classification & Units'}
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">{translations.medicine?.dosage_form || 'Dosage Form'}</label>
                <select value={formData.dosage_form} onChange={(e) => setFormData({ ...formData, dosage_form: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                  {DOSAGE_FORMS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">{translations.medicine?.strength || 'Strength'}</label>
                <input type="text" placeholder="e.g. 500mg" value={formData.strength} onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Unit Type</label>
                <input type="text" placeholder="e.g. Box, Strip" value={formData.unit_type} onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })}
                  className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 ${errors.unit_type ? 'border-red-300' : 'border-slate-200 focus:ring-emerald-500/20'}`} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Sale Unit Label</label>
                <input type="text" placeholder="e.g. per Piece, per Strip" value={formData.sale_unit_label} onChange={(e) => setFormData({ ...formData, sale_unit_label: e.target.value })}
                  className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 ${errors.sale_unit_label ? 'border-red-300' : 'border-slate-200 focus:ring-emerald-500/20'}`} />
              </div>
            </div>
          </div>

          {/* Packaging */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
               <Boxes size={12} /> {translations.medicine?.packaging_volume || 'Packaging Details'}
            </h4>
            <div className={`grid ${isStripBased ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
              {isStripBased ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">{translations.medicine?.tabs_strip || 'Tabs per Strip'}</label>
                    <input type="number" placeholder="0" value={formData.tablets_per_strip} onChange={(e) => setFormData({ ...formData, tablets_per_strip: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">{translations.medicine?.strips_box || 'Strips per Box'}</label>
                    <input type="number" placeholder="0" value={formData.strips_per_box} onChange={(e) => setFormData({ ...formData, strips_per_box: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl" />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">{translations.medicine?.volume_unit || 'Package Size'}</label>
                  <input type="text" placeholder="e.g. 100ml, 50g" value={formData.package_size} onChange={(e) => setFormData({ ...formData, package_size: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl" />
                </div>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
               <Droplets size={12} /> {translations.medicine?.pricing || 'Pricing'} (৳)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">{translations.medicine?.price_tab || 'Price per Unit'}</label>
                <input type="number" step="0.01" placeholder="0.00" value={formData.price_per_unit} onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
                  className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 ${errors.price_per_unit ? 'border-red-300' : 'border-slate-200 focus:ring-emerald-500/20'}`} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">MRP</label>
                <input type="number" step="0.01" placeholder="0.00" value={formData.mrp} onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                  className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 ${errors.mrp ? 'border-red-300' : 'border-slate-200 focus:ring-emerald-500/20'}`} />
              </div>
            </div>
            
            {isStripBased && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">{translations.medicine?.price_strip || 'Price per Strip'}</label>
                  <input type="number" step="0.01" placeholder="0.00" value={formData.price_per_stripe} onChange={(e) => setFormData({ ...formData, price_per_stripe: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">{translations.medicine?.price_box || 'Price per Box'}</label>
                  <input type="number" step="0.01" placeholder="0.00" value={formData.price_per_box} onChange={(e) => setFormData({ ...formData, price_per_box: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl" />
                </div>
              </div>
            )}

            </div>

          {/* Logistics */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
               <PackageCheck size={12} /> {translations.medicine?.status || 'Stock & Status'}
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">{translations.medicine?.reorder_level || 'Reorder Level'}</label>
                <input type="number" value={formData.reorder_level} onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-white transition-colors group">
                  <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500/20" />
                  <span className="text-xs font-bold text-slate-600 group-hover:text-emerald-600 transition-colors">{translations.medicine?.active || 'Medicine is Active'}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Static Footer */}
        <div className="shrink-0 px-6 py-5 border-t border-slate-100 bg-white">
          <button type="submit" disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-emerald-200/50 disabled:opacity-60"
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {initialData ? (translations.medicine?.update_medicine || "Update Medicine") : (translations.medicine?.add_to_inventory || "Save to Inventory")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MedicineForm;
