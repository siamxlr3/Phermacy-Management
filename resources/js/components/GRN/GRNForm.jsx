import React, { useState, useEffect } from 'react';
import { useAddGRNMutation, useUpdateGRNMutation } from '../../store/api/grnApi';
import { useAddPurchaseOrderMutation, useUpdatePurchaseOrderMutation } from '../../store/api/purchaseApi';
import { useGetActiveSuppliersQuery } from '../../store/api/supplierApi';
import { useGetActiveMedicinesQuery } from '../../store/api/medicineApi';
import { X, Receipt, Search, User, Package, Calculator, Loader2, CheckCircle2, Edit2, Info, CreditCard, Factory, Calendar, Boxes, Droplets, Plus, Trash2, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

const GROUP_A = ['Tablet', 'Capsule', 'Suppository', 'Patch'];

const GRNForm = ({ onClose, grn, mode = 'GRN' }) => {
  const isEditing = !!grn;
  const isPO = mode === 'PO';

  // Header State
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentStatus, setPaymentStatus] = useState('Due');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);

  // API Hooks
  const { data: suppliersData } = useGetActiveSuppliersQuery();
  const { data: medicinesData } = useGetActiveMedicinesQuery();
  
  const [addGRN, { isLoading: isAddingGRN }] = useAddGRNMutation();
  const [updateGRN, { isLoading: isUpdatingGRN }] = useUpdateGRNMutation();
  const [addPO, { isLoading: isAddingPO }] = useAddPurchaseOrderMutation();
  const [updatePO, { isLoading: isUpdatingPO }] = useUpdatePurchaseOrderMutation();

  const isSubmitting = isAddingGRN || isUpdatingGRN || isAddingPO || isUpdatingPO;

  const suppliers = suppliersData?.data || [];
  const medicines = medicinesData?.data || [];

  // Pre-fill form if editing
  useEffect(() => {
    if (grn) {
      setSupplierId(String(grn.supplier_id));
      setInvoiceNumber(grn.invoice_number || '');
      setReceivedBy(grn.received_by || '');
      // Handle both GRN received_date and PO order_date
      setReceivedDate(grn.received_date || grn.order_date || new Date().toISOString().split('T')[0]);
      setPaymentStatus(grn.payment_status || 'Due');
      setNotes(grn.notes || '');
      setItems(
        (grn.items || []).map(item => ({
          medicine_id: item.medicine_id,
          medicine_name: item.medicine_name,
          dosage_form: item.medicine_dosage_form,
          batch_number: item.batch_number || '',
          expiry_date: item.expiry_date || '',
          // Handle both GRN qty_boxes_received and PO qty_boxes
          qty_boxes_received: item.qty_boxes_received || item.qty_boxes || 1,
          subtotal: item.subtotal,
          cost_per_box: item.cost_per_box || item.unit_cost || '',
          cost_per_stripe: item.cost_per_stripe || '',
          cost_per_tablet: item.cost_per_tablet || '',
          strength: item.strength || '',
          volume: item.volume || '',
          price: item.price || item.unit_cost || '',
          tablet_per_stripe: item.medicine?.tablet_per_stripe || 10,
          stripe_per_box: item.medicine?.stripe_per_box || 10,
        }))
      );
    }
  }, [grn]);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        medicine_id: '',
        medicine_name: '',
        dosage_form: '',
        batch_number: '',
        expiry_date: '',
        qty_boxes_received: 1,
        subtotal: 0,
        cost_per_box: '',
        cost_per_stripe: '',
        cost_per_tablet: '',
        strength: '',
        volume: '',
        price: '',
        tablet_per_stripe: 10,
        stripe_per_box: 10,
      }
    ]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    const item = { ...newItems[index] };

    if (field === 'medicine_id') {
      const selectedMed = medicines.find(m => m.id === parseInt(value));
      if (selectedMed) {
        item.medicine_id = selectedMed.id;
        item.medicine_name = selectedMed.name;
        item.dosage_form = selectedMed.dosage_form;
        item.strength = selectedMed.strength || '';
        item.volume = selectedMed.volume || '';
        item.price = selectedMed.price || 0;
        item.cost_per_box = selectedMed.price_per_box || 0;
        item.cost_per_stripe = selectedMed.price_per_stripe || 0;
        item.cost_per_tablet = selectedMed.price_per_tablet || 0;
        item.tablet_per_stripe = selectedMed.tablet_per_stripe || 10;
        item.stripe_per_box = selectedMed.stripe_per_box || 10;
      }
    } else {
      item[field] = value;
    }

    // Auto-calculate subtotal
    const isGroupA = GROUP_A.includes(item.dosage_form);
    if (isGroupA) {
      item.subtotal = (parseFloat(item.qty_boxes_received) || 0) * (parseFloat(item.cost_per_box) || 0);
    } else {
      item.subtotal = (parseFloat(item.qty_boxes_received) || 0) * (parseFloat(item.price) || 0);
    }

    newItems[index] = item;
    setItems(newItems);
  };

  const calculateGrandTotal = () => items.reduce((sum, item) => sum + (parseFloat(item.subtotal) || 0), 0);
  const totalBoxes = items.reduce((sum, item) => sum + (parseInt(item.qty_boxes_received) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId) { toast.error('Supplier is required'); return; }
    if (items.length === 0) { toast.error('Add at least one item'); return; }
    if (items.some(i => !i.medicine_id)) {
      toast.error('Please select a medicine for all items');
      return;
    }
    if (!isPO && items.some(i => !i.batch_number || !i.expiry_date)) {
      toast.error('Complete Batch # and Expiry Date for all items');
      return;
    }
    if (items.some(i => !i.qty_boxes_received || i.qty_boxes_received <= 0)) {
      toast.error('Enter a valid quantity for all items');
      return;
    }
    if (items.some(i => {
      const cost = GROUP_A.includes(i.dosage_form) ? i.cost_per_box : i.price;
      return !cost || cost < 0;
    })) {
      toast.error('Enter a valid unit cost for all items');
      return;
    }

    const total = calculateGrandTotal();
    
    let payload;
    if (isPO) {
      payload = {
        supplier_id: supplierId,
        order_date: receivedDate, // Using the same date field
        notes,
        items: items.map(i => ({
          medicine_id: i.medicine_id,
          qty_boxes: i.qty_boxes_received,
          unit_cost: GROUP_A.includes(i.dosage_form) ? i.cost_per_box : i.price,
        }))
      };
    } else {
      payload = {
        purchase_order_id: null,
        supplier_id: supplierId,
        received_date: receivedDate,
        invoice_number: invoiceNumber,
        received_by: receivedBy,
        total_amount: total,
        paid_amount: paymentStatus === 'Paid' ? total : 0,
        payment_status: paymentStatus,
        notes,
        items,
      };
    }

    try {
      if (isPO) {
        if (isEditing) {
          await updatePO({ id: grn.id, ...payload }).unwrap();
          toast.success('Purchase Order updated');
        } else {
          await addPO(payload).unwrap();
          toast.success('Purchase Order created successfully');
        }
      } else {
        if (isEditing) {
          await updateGRN({ id: grn.id, ...payload }).unwrap();
          toast.success('GRN updated successfully');
        } else {
          await addGRN(payload).unwrap();
          toast.success('Goods Received and Stock updated');
        }
      }
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || `Failed to save ${isPO ? 'Order' : 'GRN'}`);
    }
  };

  return (
    <div className="bg-[#f8fafc] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96vh] w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="shrink-0 px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isPO ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-500'}`}>
            {isPO ? <ShoppingBag size={20} /> : <Receipt size={20} />}
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">
              {isEditing ? `Edit ${isPO ? 'Purchase Order' : 'GRN'}` : `New ${isPO ? 'Purchase Order' : 'GRN'}`} — <span className="text-slate-400 font-bold">{isPO ? 'Procurement Planning' : 'Manage Inventory Receipt'}</span>
            </h3>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all group">
          <X size={20} className="text-slate-400 group-hover:text-slate-600" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-500 uppercase">
              {isPO ? 'Order Date' : 'Received Date'}
            </label>
            <input
              type="date"
              required
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
              className="w-full px-4 py-3 text-sm bg-[#fcfdf2] border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none transition-all font-bold text-slate-700"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-500 uppercase">
              Supplier
            </label>
            <select
              required
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none transition-all appearance-none font-bold text-slate-700"
            >
              <option value="">Select Supplier</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {!isPO && (
            <>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase">
                  Invoice Number
                </label>
                <input
                  type="text"
                  placeholder="INV-SQ-2026-047"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none transition-all font-bold text-slate-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-400 outline-none transition-all font-bold text-slate-700"
                >
                  <option value="Due">Due (Unpaid)</option>
                  <option value="Paid">Fully Paid</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase">
                  Received By
                </label>
                <input
                  type="text"
                  placeholder="Employee Name"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none transition-all font-bold text-slate-700"
                />
              </div>
            </>
          )}
        </div>

        {/* Item List */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <label className="text-[11px] font-black text-slate-500 uppercase">
              Add Medicines
            </label>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => {
              const isGroupA = GROUP_A.includes(item.dosage_form);
              const totalStockUnits = isGroupA 
                ? (parseInt(item.qty_boxes_received) || 0) * (item.stripe_per_box || 10) * (item.tablet_per_stripe || 10)
                : (parseInt(item.qty_boxes_received) || 0);
              const costPerUnit = isGroupA && item.cost_per_box
                ? (parseFloat(item.cost_per_box) / ((item.stripe_per_box || 10) * (item.tablet_per_stripe || 10))).toFixed(2)
                : (parseFloat(item.price || 0)).toFixed(2);

              return (
                <div key={index} className="bg-[#f4f7f4] p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-5 relative group/item">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-white text-rose-500 border border-slate-200 rounded-full flex items-center justify-center shadow-md hover:bg-rose-50 transition-all opacity-0 group-hover/item:opacity-100 z-10"
                  >
                    <Trash2 size={14} />
                  </button>                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase">
                        Select Medicine
                      </label>
                      <select
                        required
                        value={item.medicine_id}
                        onChange={(e) => handleItemChange(index, 'medicine_id', e.target.value)}
                        className="w-full px-4 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl outline-none"
                      >
                        <option value="">Select Medicine</option>
                        {medicines.map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({m.dosage_form})</option>
                        ))}
                      </select>
                    </div>

                    {!isPO && (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase">
                            Batch #
                          </label>
                          <input
                            type="text"
                            required={!isPO}
                            placeholder="BATCH-001"
                            value={item.batch_number}
                            onChange={(e) => handleItemChange(index, 'batch_number', e.target.value)}
                            className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-400"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase">
                            Expiry Date
                          </label>
                          <input
                            type="date"
                            required={!isPO}
                            value={item.expiry_date}
                            onChange={(e) => handleItemChange(index, 'expiry_date', e.target.value)}
                            className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-400"
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase">
                        {isGroupA ? 'Qty (Boxes)' : 'Qty (Units)'}
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={item.qty_boxes_received}
                        onChange={(e) => handleItemChange(index, 'qty_boxes_received', e.target.value)}
                        className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl font-black text-slate-800 outline-none focus:border-indigo-400"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase">
                        {isGroupA ? 'Cost / Box' : 'Unit Cost'}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={isGroupA ? item.cost_per_box : item.price}
                        onChange={(e) => handleItemChange(index, isGroupA ? 'cost_per_box' : 'price', e.target.value)}
                        className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl font-black text-slate-800 outline-none focus:border-indigo-400 text-right font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase">
                        Subtotal
                      </label>
                      <div className="w-full px-4 py-2.5 text-sm bg-slate-200/50 border border-slate-200 rounded-xl font-black text-slate-600 text-right font-mono">
                        ৳ {parseFloat(item.subtotal || 0).toFixed(2)}
                      </div>
                    </div>

                    {isGroupA && (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase">Cost / Stripe</label>
                          <input type="number" step="0.01" value={item.cost_per_stripe} onChange={(e) => handleItemChange(index, 'cost_per_stripe', e.target.value)}
                            className="w-full px-4 py-2.5 text-sm bg-white/50 border border-slate-200 rounded-xl font-bold text-slate-500 outline-none text-right font-mono" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase">Cost / Tablet</label>
                          <input type="number" step="0.01" value={item.cost_per_tablet} onChange={(e) => handleItemChange(index, 'cost_per_tablet', e.target.value)}
                            className="w-full px-4 py-2.5 text-sm bg-white/50 border border-slate-200 rounded-xl font-bold text-slate-500 outline-none text-right font-mono" />
                        </div>
                      </>
                    )}

                    {isGroupA && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Strength</label>
                        <input type="text" value={item.strength} onChange={(e) => handleItemChange(index, 'strength', e.target.value)}
                          className="w-full px-4 py-2.5 text-sm bg-white/50 border border-slate-200 rounded-xl font-bold text-slate-500 outline-none" />
                      </div>
                    )}

                    {!isGroupA && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Volume</label>
                        <input type="text" value={item.volume} onChange={(e) => handleItemChange(index, 'volume', e.target.value)}
                          className="w-full px-4 py-2.5 text-sm bg-white/50 border border-slate-200 rounded-xl font-bold text-slate-500 outline-none" />
                      </div>
                    )}
                  </div>


                  {item.medicine_id && (
                    <div className="bg-white px-4 py-2 rounded-lg border border-slate-100 shadow-inner">
                      <p className="text-[11px] font-medium text-slate-600">
                        {isGroupA ? (
                          <>Stock Add: <span className="font-bold text-slate-800">{item.qty_boxes_received}</span> x <span className="font-bold text-slate-800">{item.stripe_per_box}</span> x <span className="font-bold text-slate-800">{item.tablet_per_stripe}</span> = <span className="font-black text-emerald-600">{totalStockUnits} Tablets</span> | <span className="text-slate-400 font-bold uppercase tracking-tighter text-[9px]">Cost/Tablet =</span> <span className="font-black text-indigo-600">৳ {costPerUnit}</span></>
                        ) : (
                          <>Stock Add: <span className="font-black text-emerald-600">{totalStockUnits} Units</span> | <span className="text-slate-400 font-bold uppercase tracking-tighter text-[9px]">Unit Cost =</span> <span className="font-black text-indigo-600">৳ {costPerUnit}</span></>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-600 text-xs font-black uppercase tracking-widest rounded-xl transition-all border border-slate-200 shadow-sm active:scale-95"
          >
            <Plus size={16} /> Add More Medicine
          </button>
        </div>

        {/* Notes */}
        <div className="space-y-1.5 pt-4">
          <label className="text-[11px] font-black text-slate-500 uppercase">Additional Notes (Optional)</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe any breakage or discrepancies..."
            className="w-full px-5 py-4 text-sm bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none transition-all resize-none font-medium"
          />
        </div>
      </form>

      {/* Footer */}
      <div className="shrink-0 p-8 bg-white border-t border-slate-100 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 border-b border-slate-50 pb-2">
            <span>Total Items</span>
            <span>{items.length} Product(s)</span>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 border-b border-slate-50 pb-2">
            <span>Total Quantity</span>
            <span>{totalBoxes} Box/Units</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-slate-800">Total Bill</span>
            <span className="text-xl font-black text-emerald-600">৳ {calculateGrandTotal().toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 px-6 py-3 text-sm font-black text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all uppercase tracking-widest"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`flex-[2] inline-flex items-center justify-center gap-3 px-10 py-3.5 ${isPO ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-[#1e293b] hover:bg-slate-800'} text-white text-sm font-black rounded-xl shadow-xl transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest`}
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
            {isEditing ? `Update ${isPO ? 'Order' : 'GRN'}` : `Save ${isPO ? 'Order' : 'GRN & Update Stock'} ✓`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GRNForm;
