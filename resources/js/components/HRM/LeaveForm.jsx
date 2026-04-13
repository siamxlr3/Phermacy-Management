import React, { useState, useEffect } from 'react';
import { useCreateLeaveMutation, useUpdateLeaveMutation, useGetActiveStaffQuery, useGetActiveLeaveTypesQuery } from '../../store/api/hrmApi';
import { X, Save, Calendar, User, FileText, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const LeaveForm = ({ leave, onClose }) => {
  const [formData, setFormData] = useState({
    staff_id: '',
    leave_type_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: '',
    status: 'pending'
  });

  const { data: staffData } = useGetActiveStaffQuery();
  const { data: leaveTypeData } = useGetActiveLeaveTypesQuery();
  const [createLeave, { isLoading: isCreating }] = useCreateLeaveMutation();
  const [updateLeave, { isLoading: isUpdating }] = useUpdateLeaveMutation();

  useEffect(() => {
    if (leave) {
      setFormData({
        staff_id: leave.staff_id,
        leave_type_id: leave.leave_type_id,
        start_date: leave.start_date,
        end_date: leave.end_date,
        reason: leave.reason || '',
        status: leave.status
      });
    }
  }, [leave]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (leave) await updateLeave({ id: leave.id, ...formData }).unwrap();
      else await createLeave(formData).unwrap();
      toast.success(`Application ${leave ? 'updated' : 'submitted'} successfully`);
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to submit leave application');
    }
  };

  const staffOptions = staffData?.data || [];
  const leaveTypeOptions = leaveTypeData?.data || [];

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-w-md w-full">
      {/* Header */}
      <div className="shrink-0 px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Calendar size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{leave ? 'Edit Application' : 'Apply for Leave'}</h3>
            <p className="text-xs text-slate-400 font-medium">Submit formal request for time off</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Staff Member</label>
          <div className="relative">
            <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              required
              value={formData.staff_id}
              onChange={(e) => setFormData({...formData, staff_id: e.target.value})}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 appearance-none cursor-pointer"
            >
              <option value="">Select Personnel</option>
              {staffOptions.map(s => (
                <option key={s.id} value={s.id}>{s.full_name} ({s.employee_id})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Leave Category</label>
          <select
            required
            value={formData.leave_type_id}
            onChange={(e) => setFormData({...formData, leave_type_id: e.target.value})}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 cursor-pointer"
          >
            <option value="">Select Category</option>
            {leaveTypeOptions.map(lt => (
                <option key={lt.id} value={lt.id}>{lt.name} (Max: {lt.days_allowed} Days)</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Start Date</label>
            <input
              type="date"
              required
              value={formData.start_date}
              onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">End Date</label>
            <input
              type="date"
              required
              value={formData.end_date}
              onChange={(e) => setFormData({...formData, end_date: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Reason / Note</label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({...formData, reason: e.target.value})}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 transition-all h-20 resize-none"
            placeholder="Why is this leave being requested?"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Application Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value})}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none cursor-pointer"
          >
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
           <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
           <p className="text-[10px] text-blue-600 font-medium leading-relaxed">
             Leave approval depends on the staff's remaining balance and operational requirements during the requested period.
           </p>
        </div>

        <div className="pt-2 flex items-center gap-3">
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
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-indigo-100"
          >
            <Save size={18} /> {leave ? 'Update Application' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeaveForm;
