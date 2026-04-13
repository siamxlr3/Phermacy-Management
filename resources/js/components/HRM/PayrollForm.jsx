import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useCreatePayrollMutation, useUpdatePayrollMutation, useGetActiveStaffQuery } from '../../store/api/hrmApi';
import { X, Save, DollarSign, User, Calendar as CalendarIcon, Info, Calculator } from 'lucide-react';
import toast from 'react-hot-toast';

const PayrollForm = ({ payroll, onClose }) => {
  const [formData, setFormData] = useState({
    staff_id: '',
    month: format(new Date(), 'MMMM'),
    year: new Date().getFullYear(),
    basic_salary: 0,
    bonus: 0,
    deduction: 0,
    net_salary: 0,
    status: 'unpaid',
    note: ''
  });

  const { data: staffData } = useGetActiveStaffQuery();
  const [createPayroll, { isLoading: isCreating }] = useCreatePayrollMutation();
  const [updatePayroll, { isLoading: isUpdating }] = useUpdatePayrollMutation();

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  useEffect(() => {
    if (payroll) {
      setFormData({
        staff_id: payroll.staff_id,
        month: payroll.month,
        year: payroll.year,
        basic_salary: payroll.basic_salary,
        bonus: payroll.bonus,
        deduction: payroll.deduction,
        net_salary: payroll.net_salary,
        status: payroll.status,
        note: payroll.note || ''
      });
    }
  }, [payroll]);

  // Handle staff selection to autofill basic salary
  useEffect(() => {
    if (formData.staff_id && !payroll) {
      const selectedStaff = staffData?.data?.find(s => s.id === parseInt(formData.staff_id));
      if (selectedStaff) {
        setFormData(prev => ({
          ...prev,
          basic_salary: parseFloat(selectedStaff.basic_salary) || 0,
          net_salary: parseFloat(selectedStaff.basic_salary) || 0
        }));
      }
    }
  }, [formData.staff_id, staffData, payroll]);

  // Recalculate net salary automatically
  useEffect(() => {
    const net = Number(formData.basic_salary) + Number(formData.bonus) - Number(formData.deduction);
    setFormData(prev => ({ ...prev, net_salary: net > 0 ? net : 0 }));
  }, [formData.basic_salary, formData.bonus, formData.deduction]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (payroll) await updatePayroll({ id: payroll.id, ...formData }).unwrap();
      else await createPayroll(formData).unwrap();
      toast.success(`Payroll record ${payroll ? 'updated' : 'processed'} successfully`);
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save payroll record');
    }
  };

  const staffOptions = staffData?.data || [];

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-w-md w-full">
      {/* Header */}
      <div className="shrink-0 px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
            <DollarSign size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{payroll ? 'Edit Payroll' : 'Process Salary'}</h3>
            <p className="text-xs text-slate-400 font-medium">Generate monthly salary disbursements</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Personnel Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Employee</label>
          <div className="relative">
            <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              required
              disabled={!!payroll}
              value={formData.staff_id}
              onChange={(e) => setFormData({...formData, staff_id: e.target.value})}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 appearance-none cursor-pointer disabled:opacity-60"
            >
              <option value="">Select Personnel</option>
              {staffOptions.map(s => (
                <option key={s.id} value={s.id}>{s.full_name} ({s.employee_id})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Period Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Billing Month</label>
            <select
              value={formData.month}
              disabled={!!payroll}
              onChange={(e) => setFormData({...formData, month: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none appearance-none disabled:opacity-60"
            >
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Billing Year</label>
            <select
              value={formData.year}
              disabled={!!payroll}
              onChange={(e) => setFormData({...formData, year: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none appearance-none disabled:opacity-60"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Breakdown */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
           <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                 <Calculator size={14} /> Salary Breakdown
              </span>
           </div>
           
           <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                 <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Basic Salary</span>
                 <input 
                   type="number" 
                   value={formData.basic_salary} 
                   onChange={(e) => setFormData({...formData, basic_salary: e.target.value})}
                   className="w-24 text-right bg-transparent border-b border-slate-200 text-sm font-black text-slate-700 outline-none focus:border-slate-900"
                 />
              </div>
              <div className="flex items-center justify-between gap-4">
                 <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-tight">Additional Bonus</span>
                 <input 
                   type="number" 
                   value={formData.bonus}
                   onChange={(e) => setFormData({...formData, bonus: e.target.value})}
                   className="w-24 text-right bg-transparent border-b border-slate-200 text-sm font-black text-emerald-600 outline-none focus:border-emerald-500 placeholder:text-emerald-300"
                 />
              </div>
              <div className="flex items-center justify-between gap-4">
                 <span className="text-[11px] font-bold text-rose-500 uppercase tracking-tight">Deductions</span>
                 <input 
                   type="number" 
                   value={formData.deduction}
                   onChange={(e) => setFormData({...formData, deduction: e.target.value})}
                   className="w-24 text-right bg-transparent border-b border-slate-200 text-sm font-black text-rose-600 outline-none focus:border-rose-500"
                 />
              </div>
              <div className="pt-2 mt-2 border-t border-slate-200 flex items-center justify-between gap-4">
                 <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Net Payable</span>
                 <span className="text-lg font-black text-slate-900">৳{formData.net_salary}</span>
              </div>
           </div>
        </div>

        {/* Payment Status */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Payment Status</label>
          <div className="flex items-center gap-2">
            <button
               type="button"
               onClick={() => setFormData({...formData, status: 'unpaid'})}
               className={`flex-1 py-3 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all ${
                 formData.status === 'unpaid' ? 'bg-amber-50 border-amber-500 text-amber-600' : 'bg-white border-slate-200 text-slate-400'
               }`}
            >
              Unpaid / Pending
            </button>
            <button
               type="button"
               onClick={() => setFormData({...formData, status: 'paid'})}
               className={`flex-1 py-3 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all ${
                 formData.status === 'paid' ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-sm' : 'bg-white border-slate-200 text-slate-400'
               }`}
            >
              Processed / Paid
            </button>
          </div>
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
            <Save size={18} /> {payroll ? 'Update Record' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PayrollForm;
