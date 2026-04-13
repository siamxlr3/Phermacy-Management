import React, { useState, useEffect } from 'react';
import { useAddAddressMutation, useUpdateAddressMutation } from '../../store/api/settingApi';
import { X, Loader2, MapPin, Phone, Mail, Map } from 'lucide-react';
import toast from 'react-hot-toast';

const FormField = ({ label, icon: Icon, error, children }) => (
  <div>
    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
      {Icon && <Icon size={11} className="text-slate-400" />}
      {label}
    </label>
    {children}
    {error && <p className="text-xs text-red-500 mt-1.5">⚠ {error}</p>}
  </div>
);

const AddressForm = ({ initialData, onClose }) => {
  const [addAddress, { isLoading: isAdding }] = useAddAddressMutation();
  const [updateAddress, { isLoading: isUpdating }] = useUpdateAddressMutation();

  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', address: '', google_maps_embed: '', status: 'Active',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        address: initialData.address || '',
        google_maps_embed: initialData.google_maps_embed || '',
        status: initialData.status || 'Active',
      });
    } else {
      setFormData({ name: '', phone: '', email: '', address: '', google_maps_embed: '', status: 'Active' });
    }
    setErrors({});
  }, [initialData]);

  const inputClass = (field) =>
    `w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl transition-all focus:outline-none focus:ring-2 placeholder:text-slate-300 ${
      errors[field]
        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400'
        : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-400 hover:border-slate-300'
    }`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    try {
      if (initialData) {
        await updateAddress({ id: initialData.id, ...formData }).unwrap();
        toast.success('Branch updated');
      } else {
        await addAddress(formData).unwrap();
        toast.success('Branch created');
      }
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Something went wrong');
      if (err?.data?.errors) setErrors(err.data.errors);
    }
  };

  const isLoading = isAdding || isUpdating;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm sticky top-6">

      {/* Form Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <MapPin size={15} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {initialData ? 'Edit Branch' : 'New Branch'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {initialData ? 'Update contact and location details' : 'Enter branch contact and address info'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">

        {/* Name */}
        <FormField label="Branch Name" icon={MapPin} error={errors.name}>
          <input
            type="text"
            placeholder="e.g. Downtown Branch"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={inputClass('name')}
          />
        </FormField>

        {/* Phone */}
        <FormField label="Phone Number" icon={Phone} error={errors.phone}>
          <input
            type="text"
            placeholder="+1 234 567 890"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className={inputClass('phone')}
          />
        </FormField>

        {/* Email */}
        <FormField label="Email Address" icon={Mail} error={errors.email}>
          <input
            type="email"
            placeholder="contact@pharmacy.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={inputClass('email')}
          />
        </FormField>

        {/* Physical Address */}
        <FormField label="Physical Address" icon={MapPin} error={errors.address}>
          <textarea
            placeholder="123 Health Avenue, Medical District, City..."
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            rows={3}
            className={`${inputClass('address')} resize-none`}
          />
        </FormField>

        {/* Google Maps Embed */}
        <FormField label="Google Maps Embed" icon={Map}>
          <textarea
            placeholder={'<iframe src="..." ...></iframe>'}
            value={formData.google_maps_embed}
            onChange={(e) => setFormData({ ...formData, google_maps_embed: e.target.value })}
            rows={2}
            className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 hover:border-slate-300 transition-all resize-none placeholder:text-slate-300 placeholder:font-sans"
          />
          <p className="text-[11px] text-slate-400 mt-1">Optional. Paste the embed HTML from Google Maps.</p>
        </FormField>

        {/* Status Toggle */}
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
                <span className={`w-2 h-2 rounded-full ${
                  formData.status === s
                    ? s === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'
                    : 'bg-slate-200'
                }`} />
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="border-t border-slate-100 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl transition-all duration-150 shadow-sm shadow-blue-200/80 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading && <Loader2 size={15} className="animate-spin" />}
            {initialData ? 'Save Changes' : 'Add Branch'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full mt-2 py-2 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddressForm;
