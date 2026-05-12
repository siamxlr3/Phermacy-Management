import React, { useState, useEffect } from 'react';
import { useAddGRNMutation, useUpdateGRNMutation } from '../../store/api/grnApi';
import { useAddPurchaseOrderMutation, useUpdatePurchaseOrderMutation } from '../../store/api/purchaseApi';
import { useGetActiveSuppliersQuery } from '../../store/api/supplierApi';
import { useGetActiveMedicinesQuery } from '../../store/api/medicineApi';
import { X, Receipt, Search, User, Package, Calculator, Loader2, CheckCircle2, Edit2, Info, CreditCard, Factory, Calendar, Boxes, Droplets, Plus, Trash2, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../language/GlobalTranslate.jsx';

const GROUP_A = ['Tablet', 'Capsule', 'Suppository', 'Sachet'];

const GRNForm = ({ onClose, grn, mode = 'GRN' }) => {
  const { translations } = useLanguage();
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
      setReceivedDate(grn.received_date || grn.order_date || new Date().toISOString().split('T')[0]);
      setPaymentStatus(grn.payment_status || 'Due');
      setNotes(grn.notes || '');
      setItems(
        (grn.items || []).map(item => ({
          medicine_id: item.medicine_id,
          medicine_name: item.medicine_name,
          dosage_form_snapshot: item.dosage_form_snapshot || item.medicine_dosage_form,
          batch_number: item.batch_number || '',
          expiry_date: item.expiry_date || '',
          qty_boxes_received: item.qty_boxes_received || item.qty_boxes || 1,
          qty_units_received: item.qty_units_received || 1,
          package_size: item.package_size || '',
          subtotal: item.subtotal,
          cost_per_box: item.cost_per_box || '',
          cost_per_stripe: item.cost_per_stripe || '',
          cost_per_unit: item.cost_per_unit || item.unit_cost || '',
          tablets_per_strip: item.medicine?.tablets_per_strip || 10,
          strips_per_box: item.medicine?.strips_per_box || 10,
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
        dosage_form_snapshot: '',
        batch_number: '',
        expiry_date: '',
        qty_boxes_received: 1,
        qty_units_received: 1,
        package_size: '',
        subtotal: 0,
        cost_per_box: '',
        cost_per_stripe: '',
        cost_per_unit: '',
        tablets_per_strip: 10,
        strips_per_box: 10,
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
        item.dosage_form_snapshot = selectedMed.dosage_form;
        item.package_size = selectedMed.package_size || '';
        item.cost_per_unit = selectedMed.cost_price || 0;
        item.cost_per_box = selectedMed.price_per_box || 0;
        item.cost_per_stripe = selectedMed.price_per_stripe || 0;
        item.tablets_per_strip = selectedMed.tablets_per_strip || 10;
        item.strips_per_box = selectedMed.strips_per_box || 10;
        item.qty_units_received = selectedMed.qty_units_received || 1;
      }
    } else {
      item[field] = value;
    }

    // Auto-calculate logic
    const isStripBased = GROUP_A.includes(item.dosage_form_snapshot);
    
    if (field === 'cost_per_box' && isStripBased) {
      const totalUnitsInBox = (parseFloat(item.tablets_per_strip) || 1) * (parseFloat(item.strips_per_box) || 1);
      item.cost_per_unit = (parseFloat(value) / totalUnitsInBox).toFixed(4);
    } else if (field === 'cost_per_unit' && !isStripBased) {
       // Manual unit cost entry for liquids
    }

    if (isStripBased) {
      item.subtotal = (parseFloat(item.qty_boxes_received) || 0) * (parseFloat(item.cost_per_box) || 0);
    } else {
      const unitsPerBox = parseFloat(item.qty_units_received) || 1;
      const totalUnits = (parseFloat(item.qty_boxes_received) || 0) * unitsPerBox;
      item.subtotal = totalUnits * (parseFloat(item.cost_per_unit) || 0);
    }

    newItems[index] = item;
    setItems(newItems);
  };

  const calculateGrandTotal = () => items.reduce((sum, item) => sum + (parseFloat(item.subtotal) || 0), 0);
  const totalBoxes = items.reduce((sum, item) => sum + (parseInt(item.qty_boxes_received) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId) { toast.error(translations.grn.supplier_required); return; }
    if (items.length === 0) { toast.error(translations.grn.add_one_item); return; }
    if (items.some(i => !i.medicine_id)) {
      toast.error(translations.grn.select_med_all);
      return;
    }
    if (!isPO && items.some(i => !i.batch_number || !i.expiry_date)) {
      toast.error(translations.grn.complete_batch_exp);
      return;
    }
    if (items.some(i => !i.qty_boxes_received || i.qty_boxes_received <= 0)) {
      toast.error(translations.grn.valid_qty);
      return;
    }
    if (items.some(i => {
      const isStripBased = GROUP_A.includes(i.dosage_form_snapshot);
      const cost = isStripBased ? i.cost_per_box : i.cost_per_unit;
      return !cost || cost < 0;
    })) {
      toast.error(translations.grn.valid_cost);
      return;
    }

    const total = calculateGrandTotal();
    
    let payload;
    if (isPO) {
      payload = {
        supplier_id: supplierId,
        order_date: receivedDate,
        notes,
        items: items.map(i => ({
          medicine_id: i.medicine_id,
          dosage_form_snapshot: i.dosage_form_snapshot,
          qty_boxes: i.qty_boxes_received,
          unit_cost: GROUP_A.includes(i.dosage_form_snapshot) ? i.cost_per_box : i.cost_per_unit,
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
          toast.success(translations.grn.po_updated);
        } else {
          await addPO(payload).unwrap();
          toast.success(translations.grn.po_created);
        }
      } else {
        if (isEditing) {
          await updateGRN({ id: grn.id, ...payload }).unwrap();
          toast.success(translations.grn.grn_updated);
        } else {
          await addGRN(payload).unwrap();
          toast.success(translations.grn.grn_success);
        }
      }
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || translations.grn.failed_save.replace('{type}', isPO ? 'Order' : 'GRN'));
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
              {isEditing 
                ? translations.grn.edit_type.replace('{type}', isPO ? 'Purchase Order' : 'GRN') 
                : translations.grn.new_type.replace('{type}', isPO ? 'Purchase Order' : 'GRN')} — <span className="text-slate-400 font-bold">{isPO ? translations.grn.procurement_planning : translations.grn.manage_inventory}</span>
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
              {isPO ? translations.grn.order_date : translations.grn.received_date}
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
              {translations.grn.supplier}
            </label>
            <select
              required
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none transition-all appearance-none font-bold text-slate-700"
            >
              <option value="">{translations.grn.select_supplier}</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {!isPO && (
            <>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase flex items-center justify-between">
                  {translations.grn.invoice_number}
                  <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-tighter">{translations.grn.auto_generated}</span>
                </label>
                <input
                  type="text"
                  placeholder={translations.grn.will_generate}
                  value={invoiceNumber}
                  readOnly={!isEditing}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className={`w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none transition-all font-bold ${!isEditing ? 'bg-slate-50 text-slate-400' : 'bg-white text-slate-700'}`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase">
                  {translations.grn.payment_status}
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-400 outline-none transition-all font-bold text-slate-700"
                >
                  <option value="Due">{translations.grn.due_unpaid}</option>
                  <option value="Paid">{translations.grn.fully_paid}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase">
                  {translations.grn.received_by}
                </label>
                <input
                  type="text"
                  placeholder={translations.grn.employee_name}
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
              {translations.grn.add_medicines}
            </label>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => {
              const isStripBased = GROUP_A.includes(item.dosage_form_snapshot);
              
              const totalStockUnits = isStripBased 
                ? (parseInt(item.qty_boxes_received) || 0) * (item.strips_per_box || 10) * (item.tablets_per_strip || 10)
                : (parseInt(item.qty_boxes_received) || 0) * (parseInt(item.qty_units_received) || 1);
                
              const displayCostPerUnit = parseFloat(item.cost_per_unit || 0).toFixed(4);

              return (
                <div key={index} className="bg-[#f4f7f4] p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-5 relative group/item">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-white text-rose-500 border border-slate-200 rounded-full flex items-center justify-center shadow-md hover:bg-rose-50 transition-all opacity-0 group-hover/item:opacity-100 z-10"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase">
                        {translations.grn.select_medicine}
                      </label>
                      <select
                        required
                        value={item.medicine_id}
                        onChange={(e) => handleItemChange(index, 'medicine_id', e.target.value)}
                        className="w-full px-4 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl outline-none"
                      >
                        <option value="">{translations.grn.select_medicine}</option>
                        {medicines.map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({m.dosage_form})</option>
                        ))}
                      </select>
                    </div>

                    {!isPO && (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase">
                            {translations.grn.batch_no}
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
                            {translations.grn.expiry_date}
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
                        {translations.grn.qty_boxes}
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

                    {!isStripBased && (
                       <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase">
                           Units per Box
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={item.qty_units_received}
                          onChange={(e) => handleItemChange(index, 'qty_units_received', e.target.value)}
                          className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl font-black text-slate-800 outline-none focus:border-indigo-400"
                        />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase">
                        {isStripBased ? translations.grn.cost_box : "Cost per Unit"}
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        value={isStripBased ? item.cost_per_box : item.cost_per_unit}
                        onChange={(e) => handleItemChange(index, isStripBased ? 'cost_per_box' : 'cost_per_unit', e.target.value)}
                        className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl font-black text-slate-800 outline-none focus:border-indigo-400 text-right font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase">
                        {translations.grn.subtotal}
                      </label>
                      <div className="w-full px-4 py-2.5 text-sm bg-slate-200/50 border border-slate-200 rounded-xl font-black text-slate-600 text-right font-mono">
                        ৳ {parseFloat(item.subtotal || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </div>
                    </div>

                    {isStripBased && (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase">{translations.grn.cost_stripe}</label>
                          <input type="number" step="0.01" value={item.cost_per_stripe} onChange={(e) => handleItemChange(index, 'cost_per_stripe', e.target.value)}
                            className="w-full px-4 py-2.5 text-sm bg-white/50 border border-slate-200 rounded-xl font-bold text-slate-500 outline-none text-right font-mono" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase">{translations.grn.cost_tablet}</label>
                          <div className="w-full px-4 py-2.5 text-sm bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-500 text-right font-mono">
                            {item.cost_per_unit}
                          </div>
                        </div>
                      </>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase">
                         Package Size
                      </label>
                      <div className="w-full px-4 py-2.5 text-sm bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-500">
                        {item.package_size || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {item.medicine_id && (
                    <div className="bg-white px-4 py-2 rounded-lg border border-slate-100 shadow-inner">
                      <p className="text-[11px] font-medium text-slate-600">
                        {isStripBased ? (
                          <>{translations.grn.stock_add_group_a.replace('{qty}', item.qty_boxes_received).replace('{stripes}', item.strips_per_box).replace('{tablets}', item.tablets_per_strip).replace('{total}', totalStockUnits)} | <span className="text-slate-400 font-bold uppercase tracking-tighter text-[9px]">{translations.grn.cost_tablet_label}</span> <span className="font-black text-indigo-600">৳ {displayCostPerUnit}</span></>
                        ) : (
                          <>Adding {totalStockUnits} total units ({item.qty_boxes_received} boxes × {item.qty_units_received} units) | <span className="text-slate-400 font-bold uppercase tracking-tighter text-[9px]">Cost per Unit</span> <span className="font-black text-indigo-600">৳ {displayCostPerUnit}</span></>
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
            <Plus size={16} /> {translations.grn.add_more}
          </button>
        </div>

        {/* Notes */}
        <div className="space-y-1.5 pt-4">
          <label className="text-[11px] font-black text-slate-500 uppercase">{translations.grn.notes_optional}</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={translations.grn.notes_placeholder}
            className="w-full px-5 py-4 text-sm bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none transition-all resize-none font-medium"
          />
        </div>
      </form>

      {/* Footer */}
      <div className="shrink-0 p-8 bg-white border-t border-slate-100 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 border-b border-slate-50 pb-2">
            <span>{translations.grn.total_items}</span>
            <span>{translations.grn.products_count.replace('{n}', items.length)}</span>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 border-b border-slate-50 pb-2">
            <span>{translations.grn.total_quantity}</span>
            <span>{translations.grn.box_units_count.replace('{n}', totalBoxes)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-slate-800">{translations.grn.total_bill}</span>
            <span className="text-xl font-black text-emerald-600">৳ {calculateGrandTotal().toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 px-6 py-3 text-sm font-black text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all uppercase tracking-widest"
          >
            {translations.grn.cancel}
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`flex-[2] inline-flex items-center justify-center gap-3 px-10 py-3.5 ${isPO ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-[#1e293b] hover:bg-slate-800'} text-white text-sm font-black rounded-xl shadow-xl transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest`}
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
            {isEditing 
              ? translations.grn.update_type.replace('{type}', isPO ? 'Order' : 'GRN') 
              : isPO 
                ? translations.grn.save_type.replace('{type}', 'Order') 
                : translations.grn.save_grn_stock}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GRNForm;
