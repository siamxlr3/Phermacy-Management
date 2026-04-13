import React, { useState, useEffect } from 'react';
import { useGetActiveMedicinesQuery } from '../../store/api/medicineApi';
import { useGetBatchesByMedicineQuery, useAddAdjustmentMutation, useUpdateAdjustmentMutation } from '../../store/api/adjustmentApi';
import { X, RotateCcw, Search, Calendar, User, Package, Calculator, Loader2, ArrowLeftRight, AlertCircle, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ReturnForm = ({ onClose, adjustment }) => {
  const isEditing = !!adjustment;

  const [formData, setFormData] = useState({
    medicine_id: '',
    stock_batch_id: '',
    type: 'Return',
    reason: '',
    qty_tablets_changed: '',
    adjustment_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (adjustment) {
      setFormData({
        medicine_id: String(adjustment.medicine_id),
        stock_batch_id: String(adjustment.stock_batch_id),
        type: adjustment.type,
        reason: adjustment.reason || '',
        qty_tablets_changed: Math.abs(adjustment.qty_tablets_changed),
        adjustment_date: adjustment.adjustment_date || new Date().toISOString().split('T')[0]
      });
    }
  }, [adjustment]);

  const { data: medicinesData } = useGetActiveMedicinesQuery();
  const { data: batchesData, isFetching: loadingBatches } = useGetBatchesByMedicineQuery(formData.medicine_id, {
    skip: !formData.medicine_id
  });

  const [addAdjustment, { isLoading: isAdding }] = useAddAdjustmentMutation();
  const [updateAdjustment, { isLoading: isUpdating }] = useUpdateAdjustmentMutation();
  const isSubmitting = isAdding || isUpdating;

  const medicines = medicinesData?.data || [];
  const batches = batchesData?.data || [];

  // When editing, inject the current batch if not returned by API (e.g., if it was exhausted)
  const availableBatches = [...batches];
  if (isEditing && adjustment.batch && !availableBatches.find(b => b.id === Number(formData.stock_batch_id))) {
      availableBatches.push(adjustment.batch); 
      // The old quantity includes the returned amount already
  }

  const handleMedicineChange = (id) => {
    setFormData(prev => ({ ...prev, medicine_id: id, stock_batch_id: '' }));
  };

  const selectedBatch = availableBatches.find(b => b.id === parseInt(formData.stock_batch_id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.medicine_id || !formData.stock_batch_id || !formData.qty_tablets_changed) {
      toast.error('Please fill required fields');
      return;
    }

    let maxAvailable = selectedBatch?.qty_tablets_remaining || 0;
    if (isEditing && String(selectedBatch?.id) === String(adjustment.stock_batch_id)) {
      maxAvailable += Math.abs(adjustment.qty_tablets_changed); // In edit, we can use the remaining + what was already deducted
    }

    if (selectedBatch && formData.qty_tablets_changed > maxAvailable) {
      toast.error(`Cannot remove more than available stock (${maxAvailable} tablets)`);
      return;
    }

    try {
      if (isEditing) {
        await updateAdjustment({ id: adjustment.id, ...formData }).unwrap();
        toast.success('Adjustment updated successfully');
      } else {
        await addAdjustment(formData).unwrap();
        toast.success('Stock return recorded successfully');
      }
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to record return');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="shrink-0 px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-lg ${isEditing ? 'bg-amber-500 shadow-amber-200' : 'bg-slate-900 shadow-slate-200'}`}>
            {isEditing ? <Edit2 size={20} /> : <RotateCcw size={20} />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{isEditing ? 'Edit Stock Adjustment' : 'Record Stock Return'}</h3>
            <p className="text-xs text-slate-400 font-medium">{isEditing ? 'Modify an existing adjustment' : 'Deduct stock from a specific medicine batch'}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <X size={20} className="text-slate-400" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Step 1: Medicine Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Select Medicine</label>
            <div className="relative">
              <Package size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
              <select
                required
                value={formData.medicine_id}
                onChange={(e) => handleMedicineChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all"
              >
                <option value="">Choose medicine...</option>
                {medicines.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Step 2: Batch Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Select Batch</label>
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
              <select
                required
                disabled={!formData.medicine_id || loadingBatches}
                value={formData.stock_batch_id}
                onChange={(e) => setFormData(prev => ({ ...prev, stock_batch_id: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all disabled:opacity-50"
              >
                <option value="">{loadingBatches ? 'Loading batches...' : 'Choose batch...'}</option>
                {availableBatches.map(b => (
                  <option key={b.id} value={b.id}>
                    #{b.batch_number} (Exp: {b.expiry_date}) - {
                      isEditing && String(b.id) === String(adjustment?.stock_batch_id) 
                        ? b.qty_tablets_remaining + Math.abs(adjustment.qty_tablets_changed) 
                        : b.qty_tablets_remaining
                    } available
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Step 3: Type */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Adjustment Type</label>
            <div className="relative">
              <ArrowLeftRight size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all"
              >
                <option value="Return">Supplier Return</option>
                <option value="Damage">Expired / Damaged</option>
                <option value="Correction">Inventory Correction</option>
              </select>
            </div>
          </div>

          {/* Step 4: Adjustment Date */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Adjustment Date</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="date"
                required
                value={formData.adjustment_date}
                onChange={(e) => setFormData(prev => ({ ...prev, adjustment_date: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Step 5: Quantity & Logic */}
        <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800">Deduction Details</h4>
            {selectedBatch && (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <AlertCircle size={14} className="text-amber-500" />
                Current Stock: {
                  isEditing && String(selectedBatch.id) === String(adjustment?.stock_batch_id)
                    ? selectedBatch.qty_tablets_remaining + Math.abs(adjustment.qty_tablets_changed)
                    : selectedBatch.qty_tablets_remaining
                } tablets
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Quantity to Remove (Tablets)</label>
              <div className="relative">
                <Calculator size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="number"
                  required
                  min="1"
                  max={
                    selectedBatch 
                      ? (isEditing && String(selectedBatch.id) === String(adjustment?.stock_batch_id)
                          ? selectedBatch.qty_tablets_remaining + Math.abs(adjustment.qty_tablets_changed)
                          : selectedBatch.qty_tablets_remaining)
                      : ""
                  }
                  placeholder="Enter tablet count"
                  value={formData.qty_tablets_changed}
                  onChange={(e) => setFormData(prev => ({ ...prev, qty_tablets_changed: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/10 focus:border-red-400 outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Reason for Adjustment</label>
              <input
                type="text"
                required
                placeholder="e.g. Returned expired batch to supplier"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </form>

      {/* Footer */}
      <div className="shrink-0 p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-700 transition-all font-outfit"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !formData.medicine_id || !formData.stock_batch_id}
          className={`inline-flex items-center gap-2 px-10 py-3 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 active:scale-95 translate-y-0 active:translate-y-0.5 ${isEditing ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}`}
        >
          {isSubmitting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            isEditing ? <Edit2 size={18} /> : <RotateCcw size={18} />
          )}
          {isEditing ? 'Update Deduction' : 'Confirm Stock Deduction'}
        </button>
      </div>
    </div>
  );
};

export default ReturnForm;
