import React, { useState, useEffect } from 'react';
import { useCreateStaffMutation, useUpdateStaffMutation, useGetActiveRolesQuery, useGetActiveShiftsQuery } from '../../store/api/hrmApi';
import { X, Save, User, Phone, Mail, MapPin, Calendar, CreditCard, Briefcase, Clock, ShieldCheck, BadgeCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const initialForm = {
  full_name: '',
  employee_id: '',
  phone: '',
  email: '',
  address: '',
  designation: '',
  join_date: new Date().toISOString().split('T')[0],
  basic_salary: '',
  nid_number: '',
  status: 'active',
  shift_id: '',
  role_id: ''
};

const StaffForm = ({ staff, onClose }) => {
  const [formData, setFormData] = useState(initialForm);
  const [createStaff, { isLoading: isCreating }] = useCreateStaffMutation();
  const [updateStaff, { isLoading: isUpdating }] = useUpdateStaffMutation();
  
  const { data: rolesData } = useGetActiveRolesQuery();
  const { data: shiftsData } = useGetActiveShiftsQuery();

  const roles = rolesData?.data || [];
  const shifts = shiftsData?.data || [];

  useEffect(() => {
    if (staff) {
      setFormData({
        full_name: staff.full_name || '',
        employee_id: staff.employee_id || '',
        phone: staff.phone || '',
        email: staff.email || '',
        address: staff.address || '',
        designation: staff.designation || '',
        join_date: staff.join_date || new Date().toISOString().split('T')[0],
        basic_salary: staff.basic_salary || '',
        nid_number: staff.nid_number || '',
        status: staff.status || 'active',
        shift_id: staff.shift_id || '',
        role_id: staff.role_id || ''
      });
    }
  }, [staff]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (staff) {
        await updateStaff({ id: staff.id, ...formData }).unwrap();
        toast.success('Staff records updated successfully');
      } else {
        await createStaff(formData).unwrap();
        toast.success('New staff member added successfully');
      }
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save staff record');
    }
  };

  const isSaving = isCreating || isUpdating;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="shrink-0 px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <User size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{staff ? 'Edit Staff Records' : 'New Personnel Registration'}</h3>
            <p className="text-xs text-slate-400 font-medium">
              {staff ? `Employee ID: ${staff.employee_id}` : 'Complete the profile details and assignment information'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-200 rounded-full transition-colors"
        >
          <X size={20} className="text-slate-400" />
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <form id="staff-form" onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section: Basic Identity */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <BadgeCheck size={16} className="text-blue-500" />
                Identity & Contact Details
              </h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                    placeholder="e.g. Abdullah bin Hassan"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Employee ID</label>
                <div className="relative">
                  <BadgeCheck size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.employee_id}
                    onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                    placeholder="e.g. EMP-2024-001"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">National ID (NID)</label>
                <div className="relative">
                  <ShieldCheck size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.nid_number}
                    onChange={(e) => setFormData({...formData, nid_number: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                    placeholder="Enter NID Number"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                    placeholder="abc@company.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                    placeholder="+880 1..."
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Current Address</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3.5 top-4 text-slate-400" />
                  <textarea
                    rows="2"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all resize-none"
                    placeholder="Residential address details..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Employment Details */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Briefcase size={16} className="text-blue-500" />
                Employment & Financial Info
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">


              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Basic Salary</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">৳</span>
                  <input
                    type="number"
                    required
                    value={formData.basic_salary}
                    onChange={(e) => setFormData({...formData, basic_salary: e.target.value})}
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Joining Date</label>
                <input
                  type="date"
                  required
                  value={formData.join_date}
                  onChange={(e) => setFormData({...formData, join_date: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">System Role</label>
                <select
                  required
                  value={formData.role_id}
                  onChange={(e) => setFormData({...formData, role_id: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all cursor-pointer"
                >
                  <option value="">Select Role</option>
                  {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Assigned Shift</label>
                <select
                  required
                  value={formData.shift_id}
                  onChange={(e) => setFormData({...formData, shift_id: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all cursor-pointer"
                >
                  <option value="">Select Shift</option>
                  {shifts.map(shift => <option key={shift.id} value={shift.id}>{shift.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Status</label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="resigned">Resigned</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Footer Actions */}
      <div className="shrink-0 p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
         <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">Verification & Compliance</span>
            <span className="text-sm font-bold text-slate-700 leading-none mt-1">Staff record validation active</span>
         </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-700 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="staff-form"
            disabled={isSaving}
            className={`inline-flex items-center gap-2 px-8 py-3 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 ${staff ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {staff ? 'Update Records' : 'Save Personnel'}
          </button>
        </div>
      </div>
    </div>

  );
};

export default StaffForm;
