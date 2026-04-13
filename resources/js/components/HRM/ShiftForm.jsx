import React, { useState, useEffect } from 'react';
import { useCreateShiftMutation, useUpdateShiftMutation } from '../../store/api/hrmApi';
import { X, Save, Clock, Timer } from 'lucide-react';
import toast from 'react-hot-toast';

const ShiftForm = ({ shift, onClose }) => {
  const [formData, setFormData] = useState({ 
    name: '', 
    start_time: '09:00', 
    end_time: '17:00', 
    total_hours: 8, 
    status: 'active' 
  });
  
  const [createShift, { isLoading: isCreating }] = useCreateShiftMutation();
  const [updateShift, { isLoading: isUpdating }] = useUpdateShiftMutation();

  useEffect(() => {
    if (shift) {
      setFormData({
        name: shift.name,
        start_time: shift.start_time,
        end_time: shift.end_time,
        total_hours: shift.total_hours,
        status: shift.status
      });
    }
  }, [shift]);

  // Handle automatic calculation of total hours if times change
  useEffect(() => {
     if (formData.start_time && formData.end_time) {
        const start = formData.start_time.split(':');
        const end = formData.end_time.split(':');
        
        let hours = parseInt(end[0]) - parseInt(start[0]);
        let mins = parseInt(end[1]) - parseInt(start[1]);
        
        if (mins < 0) {
           hours--;
           mins += 60;
        }
        
        if (hours < 0) hours += 24; // Handle night shifts
        
        const total = (hours + mins / 60).toFixed(2);
        if (total !== formData.total_hours) {
           setFormData(prev => ({...prev, total_hours: total}));
        }
     }
  }, [formData.start_time, formData.end_time]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (shift) await updateShift({ id: shift.id, ...formData }).unwrap();
      else await createShift(formData).unwrap();
      toast.success(`Shift ${shift ? 'updated' : 'created'} successfully`);
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save shift');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-w-md w-full">
      {/* Header */}
      <div className="shrink-0 px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Clock size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{shift ? 'Edit Shift' : 'New Operational Shift'}</h3>
            <p className="text-xs text-slate-400 font-medium">Configure timing and operational hours</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Shift Label</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all"
            placeholder="e.g. Morning Shift"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Start Time</label>
            <input
              type="time"
              required
              value={formData.start_time}
              onChange={(e) => setFormData({...formData, start_time: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">End Time</label>
            <input
              type="time"
              required
              value={formData.end_time}
              onChange={(e) => setFormData({...formData, end_time: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Operational Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value})}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none cursor-pointer"
          >
            <option value="active">Active (Online)</option>
            <option value="inactive">Inactive (Archived)</option>
          </select>
        </div>

        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <Timer size={14} className="text-indigo-400" />
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Calculated Duration</span>
           </div>
           <span className="text-sm font-black text-indigo-900">{formData.total_hours} Hours</span>
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
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save size={18} /> {shift ? 'Update Shift' : 'Confirm Shift'}
          </button>
        </div>
      </form>
    </div>

  );
};

export default ShiftForm;
