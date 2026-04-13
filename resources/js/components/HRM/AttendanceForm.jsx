import React, { useState, useEffect } from 'react';
import { useCreateAttendanceMutation, useUpdateAttendanceMutation, useGetActiveStaffQuery, useGetActiveShiftsQuery } from '../../store/api/hrmApi';
import { X, Save, Clock, User, Calendar as CalendarIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const AttendanceForm = ({ attendance, onClose }) => {
  const [formData, setFormData] = useState({
    staff_id: '',
    date: new Date().toISOString().split('T')[0],
    check_in: '09:00',
    check_out: '17:00',
    status: 'present',
    shift_id: '',
    note: ''
  });

  const { data: staffData } = useGetActiveStaffQuery();
  const { data: shiftData } = useGetActiveShiftsQuery();
  const [createAttendance, { isLoading: isCreating }] = useCreateAttendanceMutation();
  const [updateAttendance, { isLoading: isUpdating }] = useUpdateAttendanceMutation();

  useEffect(() => {
    if (attendance) {
      setFormData({
        staff_id: attendance.staff_id,
        date: attendance.date,
        check_in: attendance.check_in?.substring(0, 5) || '09:00',
        check_out: attendance.check_out?.substring(0, 5) || '17:00',
        status: attendance.status,
        shift_id: attendance.shift_id || '',
        note: attendance.note || ''
      });
    }
  }, [attendance]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (attendance) await updateAttendance({ id: attendance.id, ...formData }).unwrap();
      else await createAttendance(formData).unwrap();
      toast.success(`Attendance ${attendance ? 'updated' : 'recorded'} successfully`);
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save attendance');
    }
  };

  const staffOptions = staffData?.data || [];
  const shiftOptions = shiftData?.data || [];

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-w-md w-full">
      {/* Header */}
      <div className="shrink-0 px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
            <Clock size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{attendance ? 'Edit Record' : 'Mark Attendance'}</h3>
            <p className="text-xs text-slate-400 font-medium">Record daily presence and timings</p>
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Date</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Operating Shift</label>
            <select
              value={formData.shift_id}
              onChange={(e) => setFormData({...formData, shift_id: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 appearance-none cursor-pointer"
            >
              <option value="">Assign Shift</option>
              {shiftOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Check-In</label>
            <input
              type="time"
              value={formData.check_in}
              onChange={(e) => setFormData({...formData, check_in: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Check-Out</label>
            <input
              type="time"
              value={formData.check_out}
              onChange={(e) => setFormData({...formData, check_out: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Attendance Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value})}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none cursor-pointer"
          >
            <option value="present">Present (Standard)</option>
            <option value="late">Late Arrival</option>
            <option value="absent">Absent</option>
            <option value="half_day">Half Day</option>
            <option value="leave">On Approved Leave</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Remarks (Optional)</label>
          <textarea
            value={formData.note}
            onChange={(e) => setFormData({...formData, note: e.target.value})}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 transition-all h-20 resize-none"
            placeholder="Any specific observations..."
          />
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
            className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save size={18} /> {attendance ? 'Update Record' : 'Record Entry'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AttendanceForm;
