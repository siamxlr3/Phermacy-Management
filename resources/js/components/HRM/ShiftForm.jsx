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

  const t24To12 = (time24) => {
    if (!time24) return '';
    const [hours, mins] = time24.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12.toString().padStart(2, '0')}:${mins} ${ampm}`;
  };

  const t12To24 = (time12) => {
     if (!time12) return '';
     const [time, modifier] = time12.split(' ');
     let [hours, minutes] = time.split(':');
     if (hours === '12') hours = '00';
     if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
     return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  useEffect(() => {
    if (shift) {
      setFormData({
        name: shift.name,
        start_time: t12To24(shift.start_time),
        end_time: t12To24(shift.end_time),
        total_hours: shift.total_hours,
        status: shift.status
      });
    }
  }, [shift]);

  // Handle automatic calculation of total hours if times change
  useEffect(() => {
     if (formData.start_time && formData.end_time) {
        const [startH, startM] = formData.start_time.split(':').map(Number);
        const [endH, endM] = formData.end_time.split(':').map(Number);
        
        let diffMins = (endH * 60 + endM) - (startH * 60 + startM);
        if (diffMins < 0) diffMins += 24 * 60; // Night shift
        
        const total = (diffMins / 60).toFixed(2);
        if (total !== formData.total_hours) {
           setFormData(prev => ({...prev, total_hours: total}));
        }
     }
  }, [formData.start_time, formData.end_time]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
       ...formData,
       start_time: t24To12(formData.start_time),
       end_time: t24To12(formData.end_time)
    };

    try {
      if (shift) await updateShift({ id: shift.id, ...payload }).unwrap();
      else await createShift(payload).unwrap();
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
