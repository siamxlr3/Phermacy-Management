import React, { useState, useEffect } from 'react';
import { useAddPurchaseOrderMutation, useUpdatePurchaseOrderMutation } from '../../store/api/purchaseApi';
import { useGetActiveSuppliersQuery } from '../../store/api/supplierApi';
import { useGetActiveMedicinesQuery } from '../../store/api/medicineApi';
import { X, Plus, Trash2, ShoppingBag, Loader2, Calculator, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const PurchaseOrderForm = ({ onClose, order }) => {
  const [addPO, { isLoading: isAdding }] = useAddPurchaseOrderMutation();
  const [updatePO, { isLoading: isUpdating }] = useUpdatePurchaseOrderMutation();
  const { data: suppliersData, isLoading: leadsSuppliers } = useGetActiveSuppliersQuery();
  const { data: medicinesData, isLoading: loadingMedicines } = useGetActiveMedicinesQuery();

  const [formData, setFormData] = useState({
    supplier_id: '',
    order_date: new Date().toISOString().split('T')[0],
    notes: '',
    items: [{ medicine_id: '', qty_boxes: '', unit_cost: '', subtotal: 0 }]
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (order) {
      setFormData({
        supplier_id: order.supplier_id || '',
        order_date: order.order_date || new Date().toISOString().split('T')[0],
        notes: order.notes || '',
        items: order.items && order.items.length > 0
          ? order.items.map(i => ({ medicine_id: i.medicine_id, qty_boxes: i.qty_boxes, unit_cost: i.unit_cost, subtotal: i.subtotal }))
          : [{ medicine_id: '', qty_boxes: '', unit_cost: '', subtotal: 0 }]
      });
    } else {
      setFormData({
        supplier_id: '',
        order_date: new Date().toISOString().split('T')[0],
        notes: '',
        items: [{ medicine_id: '', qty_boxes: '', unit_cost: '', subtotal: 0 }]
      });
    }
  }, [order]);

  const suppliers = suppliersData?.data || [];
  const medicines = medicinesData?.data || [];

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { medicine_id: '', qty_boxes: '', unit_cost: '', subtotal: 0 }]
    });
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length === 1) {
      toast.error("At least one item is required");
      return;
    }
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    const item = { ...newItems[index] };
    
    item[field] = value;
    
    // Auto-select unit cost from medicine if it is new medicine
    if (field === 'medicine_id') {
      const selectedMed = medicines.find(m => m.id === parseInt(value));
      if (selectedMed) {
        item.unit_cost = selectedMed.cost_price || 0;
      }
    }

    // Recalculate subtotal
    if (field === 'qty_boxes' || field === 'unit_cost' || field === 'medicine_id') {
      item.subtotal = (parseFloat(item.qty_boxes) || 0) * (parseFloat(item.unit_cost) || 0);
    }

    newItems[index] = item;
    setFormData({ ...formData, items: newItems });
  };

  const calculateGrandTotal = () => {
    return formData.items.reduce((sum, item) => sum + (parseFloat(item.subtotal) || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (order) {
        await updatePO({ id: order.id, ...formData }).unwrap();
        toast.success('Purchase Order updated successfully');
      } else {
        await addPO(formData).unwrap();
        toast.success('Purchase Order created successfully');
      }
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save order');
      if (err?.data?.errors) setErrors(err.data.errors);
    }
  };

  const isSubmitting = isAdding || isUpdating;
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
      <div className="shrink-0 px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
            <ShoppingBag size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{order ? 'Edit Purchase Order' : 'New Purchase Order'}</h3>
            <p className="text-xs text-slate-400 font-medium">{order ? order.po_number : 'Create and track inventory procurement'}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <X size={20} className="text-slate-400" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {/* Header Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Supplier</label>
            <select
              required
              value={formData.supplier_id}
              onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
              className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
            >
              <option value="">Select Supplier</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Order Date</label>
            <input
              type="date"
              required
              value={formData.order_date}
              onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
              className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
            />
          </div>
        </div>

        {/* Items Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Calculator size={16} className="text-blue-500" />
              Order Items
            </h4>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-all"
            >
              <Plus size={14} /> Add row
            </button>
          </div>

          <div className="space-y-3">
            {formData.items.map((item, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-3 items-end bg-slate-50/40 p-3 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="flex-1 min-w-0 w-full space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Medicine</span>
                  <select
                    required
                    value={item.medicine_id}
                    onChange={(e) => handleItemChange(index, 'medicine_id', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select Medicine</option>
                    {medicines.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.generic_name})</option>
                    ))}
                  </select>
                </div>
                <div className="w-full md:w-28 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Qty (Boxes)</span>
                  <input
                    type="text"
                    required
                    value={item.qty_boxes}
                    placeholder="0"
                    onChange={(e) => handleItemChange(index, 'qty_boxes', e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="w-full md:w-32 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Unit Cost</span>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={item.unit_cost}
                      placeholder="0.00"
                      onChange={(e) => handleItemChange(index, 'unit_cost', e.target.value.replace(/[^0-9.]/g, ''))}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-right font-medium"
                    />
                  </div>
                </div>
                <div className="w-full md:w-32 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase ml-1 text-right block pr-1">Subtotal</span>
                  <div className="px-3 py-2 text-sm bg-slate-100 border border-slate-100 rounded-lg text-right font-bold text-slate-600">
                    ${parseFloat(item.subtotal || 0).toLocaleString()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Notes (Optional)</label>
          <textarea
            placeholder="Add delivery instructions or supplier notes..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
            className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all resize-none"
          />
        </div>
      </form>

      {/* Action Footer */}
      <div className="shrink-0 p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">Grand Total</span>
          <span className="text-2xl font-black text-slate-900 leading-none mt-1">
            ${calculateGrandTotal().toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-700 transition-all font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all disabled:opacity-50 disabled:scale-95 translate-y-0 active:translate-y-0.5"
          >
            {isSubmitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <CheckCircle2 size={18} />
            )}
            {order ? 'Update Order' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderForm;
