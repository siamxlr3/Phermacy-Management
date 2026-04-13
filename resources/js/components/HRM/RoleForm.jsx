import React, { useState, useEffect } from 'react';
import { useCreateRoleMutation, useUpdateRoleMutation } from '../../store/api/hrmApi';
import { X, Save, Shield, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const RoleForm = ({ role, onClose }) => {
  const [formData, setFormData] = useState({ name: '', status: 'active' });
  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();

  useEffect(() => {
    if (role) setFormData({ name: role.name, status: role.status });
  }, [role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (role) await updateRole({ id: role.id, ...formData }).unwrap();
      else await createRole(formData).unwrap();
      toast.success(`Role ${role ? 'updated' : 'created'} successfully`);
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save role');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-w-md w-full">
      {/* Header */}
      <div className="shrink-0 px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
            <Shield size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{role ? 'Edit Role' : 'New Role Definition'}</h3>
            <p className="text-xs text-slate-400 font-medium">Define structural permissions and designations</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Role Identifier</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 transition-all"
            placeholder="e.g. Sales Executive"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Operational Status</label>
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
            <Save size={18} /> {role ? 'Update Role' : 'Confirm Role'}
          </button>
        </div>
      </form>
    </div>

  );
};

export default RoleForm;
