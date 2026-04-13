import React, { useState } from 'react';
import { useGetLeaveTypesQuery, useDeleteLeaveTypeMutation } from '../../store/api/hrmApi';
import { Search, Plus, Trash2, Edit2, ListChecks } from 'lucide-react';
import toast from 'react-hot-toast';

const LeaveTypeTable = ({ onEdit, onAdd }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data, isLoading } = useGetLeaveTypesQuery({ search: searchTerm });
  const [deleteLeaveType, { isLoading: isDeleting }] = useDeleteLeaveTypeMutation();

  const handleDelete = async (lt) => {
    if (!confirm(`Are you sure you want to delete "${lt.name}"?`)) return;
    try {
      await deleteLeaveType(lt.id).unwrap();
      toast.success('Leave type deleted successfully');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete leave type');
    }
  };

  const leaveTypes = data?.data || [];

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-0">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none w-64 placeholder:text-slate-400 font-medium"
          />
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-slate-100"
        >
          <Plus size={14} /> New Category
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 border-b border-slate-200 shadow-sm">
            <tr>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Category Name</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Days Allowed</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                  <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-100 rounded w-12 mx-auto"></div></td>
                  <td className="px-6 py-4 text-center"><div className="h-6 bg-slate-100 rounded-full w-20 mx-auto"></div></td>
                  <td className="px-6 py-4 text-right"><div className="h-8 bg-slate-100 rounded w-16 ml-auto"></div></td>
                </tr>
              ))
            ) : leaveTypes.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-20 text-center">
                   <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No leave categories defined</p>
                </td>
              </tr>
            ) : (
              leaveTypes.map((lt) => (
                <tr key={lt.id} className="group transition-all duration-150 hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm">
                        <ListChecks size={16} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">{lt.name}</span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[200px]">{lt.description}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-black text-slate-600 px-2 py-1 bg-slate-100 rounded-lg border border-slate-200">
                       {lt.days_allowed} Days
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${
                      lt.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}>
                      {lt.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => onEdit(lt)} className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={15} /></button>
                      <button onClick={() => handleDelete(lt)} disabled={isDeleting} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaveTypeTable;
