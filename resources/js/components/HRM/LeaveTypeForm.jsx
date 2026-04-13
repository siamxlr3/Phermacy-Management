import React, { useState, useEffect } from 'react';
import { useCreateLeaveTypeMutation, useUpdateLeaveTypeMutation } from '../../store/api/hrmApi';
import { X, Save, ListChecks } from 'lucide-react';
import toast from 'react-hot-toast';

const LeaveTypeForm = ({ leaveType, onClose }) => {
  const [formData, setFormData] = useState({ 
    name: '', 
    days_allowed: 10, 
    description: '', 
    status: 'active' 
  });
  
  const [createLeaveType, { isLoading: isCreating }] = useCreateLeaveTypeMutation();
  const [updateLeaveType, { isLoading: isUpdating }] = useUpdateLeaveTypeMutation();

  useEffect(() => {
    if (leaveType) {
      setFormData({
        name: leaveType.name,
        days_allowed: leaveType.days_allowed,
        description: leaveType.description || '',
        status: leaveType.status
      });
    }
  }, [leaveType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (leaveType) await updateLeaveType({ id: leaveType.id, ...formData }).unwrap();
      else await createLeaveType(formData).unwrap();
      toast.success(`Category ${leaveType ? 'updated' : 'created'} successfully`);
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save leave type');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-w-md w-full">
      {/* Header */}
      <div className="shrink-0 px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
            <ListChecks size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{leaveType ? 'Edit Category' : 'New Leave Category'}</h3>
            <p className="text-xs text-slate-400 font-medium">Define entitlement rules and limits</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Category Name</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 transition-all"
            placeholder="e.g. Annual Leave"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Days Allowed Per Year</label>
          <input
            type="number"
            required
            min="1"
            value={formData.days_allowed}
            onChange={(e) => setFormData({...formData, days_allowed: e.target.value})}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 transition-all h-24 resize-none"
            placeholder="Describe the leave policy..."
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value})}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none cursor-pointer"
          >
            <option value="active">Active (Standard)</option>
            <option value="inactive">Inactive (Restricted)</option>
          </select>
        </div>

        <div className="pt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-700 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isCreating || isUpdating}
            className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save size={18} /> {leaveType ? 'Update Category' : 'Confirm Category'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeaveTypeForm;
