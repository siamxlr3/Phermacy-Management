import React, { useState, useEffect } from 'react';
import { useAddManufacturerMutation, useUpdateManufacturerMutation } from '../../store/api/medicineApi';
import { X, Loader2, Factory } from 'lucide-react';
import toast from 'react-hot-toast';

const ManufacturerForm = ({ initialData, onClose }) => {
  const [addManufacturer, { isLoading: isAdding }] = useAddManufacturerMutation();
  const [updateManufacturer, { isLoading: isUpdating }] = useUpdateManufacturerMutation();

  const [formData, setFormData] = useState({ name: '', description: '', status: 'Active' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({ name: initialData.name, description: initialData.description || '', status: initialData.status });
    } else {
      setFormData({ name: '', description: '', status: 'Active' });
    }
    setErrors({});
  }, [initialData]);

  const validate = () => {
    const e = {};
    if (!formData.name.trim()) e.name = 'Company name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (initialData) {
        await updateManufacturer({ id: initialData.id, ...formData }).unwrap();
        toast.success('Manufacturer updated');
      } else {
        await addManufacturer(formData).unwrap();
        toast.success('Manufacturer created');
      }
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Something went wrong');
      if (err?.data?.errors) setErrors(err.data.errors);
    }
  };

  const isLoading = isAdding || isUpdating;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm sticky top-0">
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <Factory size={15} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {initialData ? 'Edit Manufacturer' : 'New Manufacturer'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {initialData ? 'Modify company details' : 'Add an affiliate or supplier'}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2">Company Name</label>
          <input
            type="text"
            placeholder="e.g. Pfizer, GSK"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl transition-all focus:outline-none focus:ring-2 ${
              errors.name ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400' : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-400 hover:border-slate-300'
            } placeholder:text-slate-300`}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">⚠ {errors.name}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2">Description</label>
          <textarea
            placeholder="Optional details, contact info, notes..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl transition-all focus:outline-none focus:ring-2 border-slate-200 focus:ring-blue-500/20 focus:border-blue-400 hover:border-slate-300 placeholder:text-slate-300 resize-none`}
          />
        </div>

        <div>
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

        <div className="border-t border-slate-100 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl transition-all duration-150 shadow-sm shadow-blue-200/80 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading && <Loader2 size={15} className="animate-spin" />}
            {initialData ? 'Save Changes' : 'Add Manufacturer'}
          </button>
          <button type="button" onClick={onClose} className="w-full mt-2 py-2 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManufacturerForm;
