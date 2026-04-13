import React, { useState, useEffect } from 'react';
import { useGetAttendanceQuery, useDeleteAttendanceMutation } from '../../store/api/hrmApi';
import { Search, Plus, Clock, User, Calendar, Trash2, Edit2, CheckCircle2, XCircle, AlertCircle, Clock3 } from 'lucide-react';
import { format } from 'date-fns';
import DateRangeFilter from '../Shared/DateRangeFilter';
import toast from 'react-hot-toast';

const AttendanceTable = ({ onAdd, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('');
  const [fromDate, setFromDate] = useState(format(new Date(), 'yyyy-MM-01'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, isLoading, isFetching } = useGetAttendanceQuery({
    search: debouncedSearch,
    status,
    from_date: fromDate,
    to_date: toDate
  });

  const [deleteAttendance, { isLoading: isDeleting }] = useDeleteAttendanceMutation();

  const handleDelete = async (att) => {
    if (!confirm(`Remove attendance record for ${att.staff_name} on ${att.date}?`)) return;
    try {
      await deleteAttendance(att.id).unwrap();
      toast.success('Record removed');
    } catch (err) {
      toast.error('Failed to delete record');
    }
  };

  const records = data?.data || [];
  const isLoadingState = isLoading || isFetching;

  const getStatusConfig = (status) => {
    switch (status) {
      case 'present': return { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: <CheckCircle2 size={12} /> };
      case 'late': return { color: 'bg-amber-50 text-amber-600 border-amber-100', icon: <Clock3 size={12} /> };
      case 'absent': return { color: 'bg-rose-50 text-rose-600 border-rose-100', icon: <XCircle size={12} /> };
      case 'half_day': return { color: 'bg-blue-50 text-blue-600 border-blue-100', icon: <AlertCircle size={12} /> };
      case 'leave': return { color: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: <Calendar size={12} /> };
      default: return { color: 'bg-slate-50 text-slate-600 border-slate-100', icon: null };
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-0">
      {/* Filters */}
      <div className="shrink-0 p-6 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-slate-50/30">
        <div className="flex flex-wrap items-center gap-4">
          <DateRangeFilter 
            fromDate={fromDate} 
            toDate={toDate} 
            hideLabel={true}
            hidePresets={true}
            onChange={(from, to) => { setFromDate(from); setToDate(to); }}
            onReset={() => { setFromDate(''); setToDate(''); }}
          />
          
          <select 
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none min-w-[140px] font-medium text-slate-600"
          >
            <option value="">All Statuses</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="absent">Absent</option>
            <option value="half_day">Half Day</option>
            <option value="leave">On Leave</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Staff Name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none w-full sm:w-64 placeholder:text-slate-400 font-medium"
            />
          </div>
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 shadow-slate-200"
          >
            <Plus size={16} /> Mark Attendance
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 border-b border-slate-200 shadow-sm">
            <tr>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Staff Member</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Date</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Timings</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Shift</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoadingState ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-10 bg-slate-100 rounded-lg w-40"></div></td>
                  <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-100 rounded w-20 mx-auto"></div></td>
                  <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-100 rounded w-32 mx-auto"></div></td>
                  <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-100 rounded w-16 mx-auto"></div></td>
                  <td className="px-6 py-4 text-center"><div className="h-6 bg-slate-100 rounded-full w-20 mx-auto"></div></td>
                  <td className="px-6 py-4 text-right"><div className="h-8 bg-slate-100 rounded-lg w-16 ml-auto"></div></td>
                </tr>
              ))
            ) : records.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-20 text-center">
                   <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No records found for this period</p>
                </td>
              </tr>
            ) : (
              records.map((att) => {
                const config = getStatusConfig(att.status);
                return (
                  <tr key={att.id} className="group transition-all duration-150 hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 border border-slate-200">
                          <User size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700">{att.staff_name}</span>
                          <span className="text-[10px] font-medium text-blue-500 uppercase tracking-widest">{att.employee_id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center uppercase text-[11px] font-bold text-slate-500 tracking-wider">
                      {att.date}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col gap-0.5 items-center">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                           <Clock size={10} className="text-slate-400" />
                           <span>{att.check_in || '--:--'}</span>
                           <span className="text-slate-300">→</span>
                           <span>{att.check_out || '--:--'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-[10px] font-bold text-slate-500 px-2 py-0.5 bg-slate-50 rounded border border-slate-100">
                        {att.shift_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${config.color}`}>
                        {config.icon}
                        {att.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => onEdit(att)} className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={15} /></button>
                        <button onClick={() => handleDelete(att)} disabled={isDeleting} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceTable;
