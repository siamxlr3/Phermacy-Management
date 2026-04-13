import React, { useState, useEffect } from 'react';
import { useAddSupplierMutation, useUpdateSupplierMutation } from '../../store/api/supplierApi';
import { X, Loader2, Truck, User, Phone, Mail, MapPin, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';

const SupplierForm = ({ initialData, onClose }) => {
  const [addSupplier, { isLoading: isAdding }] = useAddSupplierMutation();
  const [updateSupplier, { isLoading: isUpdating }] = useUpdateSupplierMutation();

  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    credit_days: '',
    status: 'Active'
  });
  
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        contact_person: initialData.contact_person || '',
        phone: initialData.phone,
        email: initialData.email || '',
        address: initialData.address || '',
        credit_days: initialData.credit_days || '',
        status: initialData.status
      });
    } else {
      setFormData({
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        credit_days: '',
        status: 'Active'
      });
    }
    setErrors({});
  }, [initialData]);

  const validate = () => {
    const e = {};
    if (!formData.name.trim()) e.name = 'Supplier name is required';
    if (!formData.phone.trim()) e.phone = 'Phone number is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (initialData) {
        await updateSupplier({ id: initialData.id, ...formData }).unwrap();
        toast.success('Supplier updated successfully');
      } else {
        await addSupplier(formData).unwrap();
        toast.success('Supplier added successfully');
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
            <Truck size={15} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {initialData ? 'Edit Supplier' : 'New Supplier'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {initialData ? 'Update vendor credentials' : 'Add a new business partner'}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Company Detail</label>
          <div className="space-y-3">
            <div className="relative">
              <Truck size={14} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Supplier Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border rounded-xl transition-all focus:outline-none focus:ring-2 ${
                  errors.name ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400' : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-400 hover:border-slate-300'
                } placeholder:text-slate-300`}
              />
              {errors.name && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.name}</p>}
            </div>
            
            <div className="relative">
              <User size={14} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Contact Person (Optional)"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 hover:border-slate-300 placeholder:text-slate-300"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Contact & Finance</label>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="relative">
              <Phone size={14} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border rounded-xl transition-all focus:outline-none focus:ring-2 ${
                  errors.phone ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400' : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-400 hover:border-slate-300'
                } placeholder:text-slate-300`}
              />
            </div>
            <div className="relative">
              <CalendarDays size={14} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Credit Days"
                value={formData.credit_days}
                onChange={(e) => setFormData({ ...formData, credit_days: e.target.value.replace(/[^0-9]/g, '') })}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 hover:border-slate-300 placeholder:text-slate-300"
              />
            </div>
          </div>
          <div className="relative">
            <Mail size={14} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border rounded-xl transition-all focus:outline-none focus:ring-2 ${
                errors.email ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400' : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-400 hover:border-slate-300'
              } placeholder:text-slate-300`}
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Address</label>
          <div className="relative">
            <MapPin size={14} className="absolute left-3.5 top-3 text-slate-400" />
            <textarea
              placeholder="Street address, city, state..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={2}
              className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 hover:border-slate-300 placeholder:text-slate-300 resize-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Account Status</label>
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

        <div className="border-t border-slate-100 pt-4 pb-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl transition-all duration-150 shadow-sm shadow-blue-200/80 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading && <Loader2 size={15} className="animate-spin" />}
            {initialData ? 'Save Changes' : 'Create Supplier'}
          </button>
          <button type="button" onClick={onClose} className="w-full mt-2 py-2 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default SupplierForm;
