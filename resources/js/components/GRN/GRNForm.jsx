import React, { useState, useEffect, useRef } from 'react';
import { useAddGRNMutation, useUpdateGRNMutation } from '../../store/api/grnApi';
import { useAddPurchaseOrderMutation, useUpdatePurchaseOrderMutation } from '../../store/api/purchaseApi';
import { useGetActiveSuppliersQuery } from '../../store/api/supplierApi';
import { useGetActiveMedicinesQuery } from '../../store/api/medicineApi';
import { X, Search, Plus, Trash2, Save, ShoppingBag, Receipt, Boxes, Droplets, Info, Loader2, FlaskConical, Pill, Syringe, Biohazard, Baby, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../language/GlobalTranslate.jsx';

const GROUP_A = ['Tablet', 'Capsule', 'Suppository', 'Sachet'];
const LIQUID_FORMS = ['Syrup', 'Suspension', 'Drops', 'Oral Solution'];
const TOPICAL_FORMS = ['Cream', 'Ointment', 'Gel', 'Lotion', 'Patch'];
const INJECTION_FORMS = ['Injection', 'Vial', 'Ampoule', 'Infusion'];

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

  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

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
          name: item.medicine_name,
          generic: item.medicine?.generic_name || '',
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
          mrp: item.medicine?.mrp || item.medicine?.price_per_unit || 0,
          stock: item.medicine?.stock || 0
        }))
      );
    }
  }, [grn]);

  // Click outside search to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectMedicine = (med) => {
    // Check if already added
    if (items.some(i => i.medicine_id === med.id)) {
      toast.error(translations.grn?.already_added || 'Medicine already added');
      setIsSearchOpen(false);
      return;
    }

    const isManualEntry = ['Tablet', 'Capsule'].includes(med.dosage_form);
    const isStripBased = GROUP_A.includes(med.dosage_form);
    
    const initialPricePerBox = parseFloat(med.price_per_box) || 0;
    const stripsPerBox = parseInt(med.strips_per_box) || 1;
    const tabsPerStrip = parseInt(med.tablets_per_strip) || 1;
    const unitsPerBox = med.qty_units_received || 1; // Fallback to 1

    let initialCostPerUnit = parseFloat(med.price_per_unit) || 0;
    let initialCostPerStripe = parseFloat(med.price_per_stripe) || 0;

    // Auto-calculation disabled as per user request

    setItems([
      ...items,
      {
        medicine_id: med.id,
        name: med.medicine_name,
        generic: med.generic_name,
        dosage_form_snapshot: med.dosage_form,
        batch_number: '',
        expiry_date: '',
        qty_boxes_received: 1,
        qty_units_received: unitsPerBox,
        package_size: med.package_size || '',
        subtotal: isManualEntry ? 0 : initialPricePerBox,
        cost_per_box: isManualEntry ? 0 : initialPricePerBox,
        cost_per_stripe: isManualEntry ? 0 : initialCostPerStripe,
        cost_per_unit: isManualEntry ? 0 : initialCostPerUnit,
        tablets_per_strip: tabsPerStrip,
        strips_per_box: stripsPerBox,
        mrp: med.mrp || med.price_per_unit || 0,
        stock: med.stock || 0
      }
    ]);
    setIsSearchOpen(false);
    setSearchTerm('');
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    const item = { ...newItems[index] };
    item[field] = value;

    const isStripBased = GROUP_A.includes(item.dosage_form_snapshot);
    const costPerBox = parseFloat(item.cost_per_box) || 0;
    const qtyBoxes = parseFloat(item.qty_boxes_received) || 0;
    const qtyUnitsPerBox = parseFloat(item.qty_units_received) || 1;
    const strips = parseInt(item.strips_per_box) || 1;
    const tabs = parseInt(item.tablets_per_strip) || 1;

    // 1. Calculate Subtotal
    item.subtotal = qtyBoxes * costPerBox;

    // 2. Auto-calculation of unit costs disabled as per user request

    newItems[index] = item;
    setItems(newItems);
  };

  const calculateGrandTotal = () => items.reduce((sum, item) => sum + (parseFloat(item.subtotal) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId) { toast.error(translations.grn.supplier_required); return; }
    if (items.length === 0) { toast.error(translations.grn.add_one_item); return; }
    
    if (!isPO && items.some(i => !i.expiry_date)) {
      toast.error(translations.grn?.complete_exp || 'Please complete expiry date for all items');
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
          cost_per_box: i.cost_per_box,
          cost_per_unit: i.cost_per_unit,
          cost_per_stripe: i.cost_per_stripe || null,
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

  const filteredMedicines = searchTerm.trim() === '' 
    ? [] 
    : medicines.filter(m => 
        (m.medicine_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (m.generic_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 8);

  const getDosageIcon = (form) => {
    if (GROUP_A.includes(form)) return <Pill size={16} className="text-indigo-500" />;
    if (LIQUID_FORMS.includes(form)) return <FlaskConical size={16} className="text-blue-500" />;
    if (TOPICAL_FORMS.includes(form)) return <Droplets size={16} className="text-amber-500" />;
    if (INJECTION_FORMS.includes(form)) return <Syringe size={16} className="text-rose-500" />;
    return <Biohazard size={16} className="text-slate-500" />;
  };

  const getDosageBadgeClass = (form) => {
    if (GROUP_A.includes(form)) return "bg-indigo-50 text-indigo-700";
    if (LIQUID_FORMS.includes(form)) return "bg-blue-50 text-blue-700";
    if (TOPICAL_FORMS.includes(form)) return "bg-amber-50 text-amber-700";
    if (INJECTION_FORMS.includes(form)) return "bg-rose-50 text-rose-700";
    return "bg-slate-50 text-slate-700";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
      <style>{`
        .grn-modal { background: white; border-radius: 20px; overflow: hidden; width: 100%; max-width: 720px; box-shadow: 0 20px 50px rgba(0,0,0,0.15); display: flex; flex-direction: column; max-height: 94vh; }
        .grn-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 0.5px solid #f1f5f9; }
        .grn-header h3 { font-size: 15px; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 10px; }
        .grn-body { padding: 24px; overflow-y: auto; flex: 1; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .form-row.three { grid-template-columns: 1fr 1fr 1fr; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8; }
        .form-group input, .form-group select { padding: 12px 16px; border: 1.5px solid #e2e8f0; border-radius: 14px; font-size: 14px; color: #1e293b; font-weight: 600; width: 100%; transition: all 0.2s; background: white; }
        .form-group input:focus, .form-group select:focus { outline: none; border-color: #10b981; box-shadow: 0 0 0 4px rgba(16,185,129,0.08); background: white; }
        .readonly { background: #f1f5f9 !important; color: #94a3b8 !important; border-color: #e2e8f0 !important; cursor: not-allowed; }
        .auto-tag { font-size: 9px; color: #0369a1; background: #e0f2fe; padding: 2px 6px; border-radius: 6px; font-weight: 700; margin-left: 6px; text-transform: uppercase; }
        .section-label { font-size: 11px; font-weight: 800; color: #475569; margin: 24px 0 12px; padding-bottom: 8px; border-bottom: 1.5px solid #f1f5f9; text-transform: uppercase; display: flex; align-items: center; justify-content: space-between; }
        .med-card { background: #f8fafc; border: 1.5px solid #f1f5f9; border-radius: 16px; padding: 16px; margin-bottom: 16px; position: relative; transition: all 0.2s; }
        .med-card:hover { border-color: #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
        .med-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .med-badge { font-size: 10px; padding: 3px 10px; border-radius: 20px; font-weight: 700; }
        .remove-btn { width: 32px; height: 32px; border-radius: 10px; border: 1.5px solid #f1f5f9; background: white; color: #94a3b8; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .remove-btn:hover { background: #fef2f2; color: #ef4444; border-color: #fee2e2; }
        .search-wrap { position: relative; }
        .search-input { width: 100%; padding: 12px 16px 12px 42px; border: 1.5px solid #f1f5f9; border-radius: 14px; font-size: 14px; color: #1e293b; font-weight: 600; transition: all 0.2s; }
        .search-input:focus { outline: none; border-color: #10b981; box-shadow: 0 0 0 4px rgba(16,185,129,0.05); }
        .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
        .dropdown { position: absolute; top: calc(100% + 8px); left: 0; right: 0; background: white; border: 1.5px solid #f1f5f9; border-radius: 14px; z-index: 100; max-height: 280px; overflow-y: auto; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        .dd-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; cursor: pointer; border-bottom: 1px solid #f8fafc; transition: all 0.1s; }
        .dd-item:hover { background: #f8fafc; }
        .dd-left h5 { font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 2px; }
        .dd-left p { font-size: 11px; color: #64748b; font-weight: 500; }
        .dd-right { text-align: right; }
        .dd-right .price { font-size: 12px; font-weight: 700; color: #059669; }
        .dd-right .stock { font-size: 10px; color: #94a3b8; font-weight: 600; }
        .info-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
        .info-pill { font-size: 10px; padding: 4px 10px; border-radius: 8px; background: white; color: #64748b; border: 1px solid #f1f5f9; font-weight: 700; display: flex; align-items: center; gap: 6px; }
        .calc-box { background: white; border: 1.5px solid #f1f5f9; border-radius: 12px; padding: 10px 16px; margin-top: 12px; font-size: 12px; color: #64748b; display: flex; justify-content: space-between; align-items: center; font-weight: 600; }
        .calc-box strong { color: #1e293b; font-size: 13px; font-weight: 800; }
        .grn-footer { padding: 24px; border-top: 1.5px solid #f1f5f9; background: white; }
        .totals-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .totals-row span { font-size: 12px; font-weight: 700; color: #64748b; }
        .totals-row strong { font-size: 18px; font-weight: 900; color: #059669; }
        .btn-cancel { padding: 12px 24px; border-radius: 12px; font-size: 13px; font-weight: 800; color: #64748b; border: 1.5px solid #f1f5f9; background: transparent; cursor: pointer; transition: all 0.2s; }
        .btn-cancel:hover { background: #f8fafc; color: #1e293b; }
        .btn-save { flex: 1; padding: 12px 24px; border-radius: 12px; font-size: 13px; font-weight: 800; color: white; background: #1e293b; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; }
        .btn-save:hover { background: #0f172a; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(30,41,59,0.2); }
        .btn-save:active { transform: translateY(0); }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>

      <div className="grn-modal animate-in fade-in zoom-in duration-200">
        <div className="grn-header">
          <h3>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Receipt size={18} className="text-emerald-600" />
            </div>
            {isEditing 
              ? translations.grn?.edit_type?.replace('{type}', isPO ? 'Purchase Order' : 'GRN') || `Edit ${mode}`
              : translations.grn?.new_type?.replace('{type}', isPO ? 'Purchase Order' : 'GRN') || `New ${mode}`}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="grn-body custom-scrollbar">
          {/* Header fields */}
          <div className="form-row">
            <div className="form-group">
              <label>{isPO ? translations.grn?.order_date : translations.grn?.received_date || 'Received date'}</label>
              <input type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label>{translations.grn?.supplier || 'Supplier'}</label>
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {!isPO && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Invoice number <span className="auto-tag">auto</span></label>
                  <input 
                    type="text" 
                    className={!isEditing ? "readonly" : ""} 
                    value={invoiceNumber} 
                    readOnly={!isEditing}
                    placeholder="Auto-generated"
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>{translations.grn?.payment_status || 'Payment status'}</label>
                  <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                    <option value="Due">Due (Unpaid)</option>
                    <option value="Paid">Fully Paid</option>
                    <option value="Partially Paid">Partially Paid</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{translations.grn?.received_by || 'Received by'}</label>
                  <input 
                    type="text" 
                    value={receivedBy} 
                    placeholder="Staff/Employee name"
                    onChange={(e) => setReceivedBy(e.target.value)} 
                  />
                </div>
                <div className="form-group"></div>
              </div>
            </>
          )}

          <div className="section-label">
            <span>{translations.grn?.add_medicines || 'Added medicines'}</span>
            <span style={{ color: '#94a3b8' }}>{items.length} items added</span>
          </div>

          {/* Added Medicine Cards */}
          {items.map((item, index) => {
            const isStripBased = GROUP_A.includes(item.dosage_form_snapshot);
            const isLiquid = LIQUID_FORMS.includes(item.dosage_form_snapshot);
            const isTopical = TOPICAL_FORMS.includes(item.dosage_form_snapshot);
            const isInjection = INJECTION_FORMS.includes(item.dosage_form_snapshot);

            return (
              <div key={index} className="med-card animate-in slide-in-from-top-4 duration-200">
                <div className="med-card-header">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                      {getDosageIcon(item.dosage_form_snapshot)}
                    </div>
                    <div>
                      <div className="text-[14px] font-bold text-slate-800 leading-tight">{item.name}</div>
                      <div className="text-[11px] font-semibold text-slate-400">{item.generic} · {item.package_size}</div>
                    </div>
                    <span className={`med-badge ${getDosageBadgeClass(item.dosage_form_snapshot)}`}>
                      {item.dosage_form_snapshot}
                    </span>
                  </div>
                  <button className="remove-btn" onClick={() => handleRemoveItem(index)}>
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="info-row">
                  {isStripBased ? (
                    <>
                      <span className="info-pill"><Boxes size={12} /> {item.tablets_per_strip} tabs/strip</span>
                      <span className="info-pill"><Package size={12} /> {item.strips_per_box} strips/box</span>
                    </>
                  ) : (
                    <>
                      <span className="info-pill">{item.package_size} / unit</span>
                      <span className="info-pill">{item.qty_units_received} units/box</span>
                    </>
                  )}
                  <span className="info-pill">৳{parseFloat(item.mrp).toFixed(2)}/unit (MRP)</span>
                  <span className="info-pill bg-emerald-50 text-emerald-700 border-emerald-100">Stock: {item.stock} units</span>
                </div>

                <div className="form-row three">
                  {!isPO && (
                    <>
                      <div className="form-group">
                        <label>Batch # <span className="auto-tag">auto if empty</span></label>
                        <input 
                          type="text" 
                          placeholder="Auto-generated" 
                          value={item.batch_number}
                          onChange={(e) => handleItemChange(index, 'batch_number', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Expiry date</label>
                        <input 
                          type="date" 
                          value={item.expiry_date}
                          onChange={(e) => handleItemChange(index, 'expiry_date', e.target.value)}
                        />
                      </div>
                    </>
                  )}
                  <div className="form-group">
                    <label>Qty (boxes)</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      value={item.qty_boxes_received}
                      onChange={(e) => handleItemChange(index, 'qty_boxes_received', e.target.value)}
                    />
                  </div>
                  {isPO && <div className="form-group"></div>}
                  {isPO && <div className="form-group"></div>}
                </div>

                <div className={isStripBased ? "form-row three" : "form-row"}>
                  <div className="form-group">
                    <label>{isStripBased ? 'Cost/box' : 'Cost/box'} <span className="auto-tag">enter</span></label>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      value={item.cost_per_box}
                      onChange={(e) => handleItemChange(index, 'cost_per_box', e.target.value)}
                    />
                  </div>
                  {isStripBased ? (
                    <>
                      <div className="form-group">
                        <label>Cost/strip <span className="auto-tag">enter</span></label>
                        <input 
                          type="text" 
                          inputMode="decimal"
                          value={item.cost_per_stripe} 
                          onChange={(e) => handleItemChange(index, 'cost_per_stripe', e.target.value)} 
                        />
                      </div>
                      <div className="form-group">
                        <label>Cost/tab <span className="auto-tag">enter</span></label>
                        <input 
                          type="text" 
                          inputMode="decimal"
                          value={item.cost_per_unit} 
                          onChange={(e) => handleItemChange(index, 'cost_per_unit', e.target.value)} 
                        />
                      </div>
                    </>
                  ) : null}
                </div>

                <div className="calc-box">
                  {isStripBased ? (
                    <span>{item.qty_boxes_received} boxes × {item.strips_per_box} strips × {item.tablets_per_strip} tabs = <strong>{(item.qty_boxes_received * item.strips_per_box * item.tablets_per_strip).toLocaleString()} tablets</strong></span>
                  ) : (
                    <span>{item.qty_boxes_received} boxes × {item.qty_units_received} units = <strong>{(item.qty_boxes_received * item.qty_units_received).toLocaleString()} units</strong></span>
                  )}
                  <strong>Subtotal: ৳{parseFloat(item.subtotal || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</strong>
                </div>
              </div>
            );
          })}

          {/* Medicine Search */}
          <div ref={searchRef} className="search-wrap mt-4">
            <div className="relative">
              <Search size={18} className="search-icon" />
              <input 
                className="search-input" 
                type="text" 
                placeholder="Search medicine by name or generic..." 
                value={searchTerm}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {isSearchOpen && (
              <div className="dropdown custom-scrollbar">
                {filteredMedicines.length > 0 ? (
                  filteredMedicines.map(med => (
                    <div key={med.id} className="dd-item" onClick={() => handleSelectMedicine(med)}>
                      <div className="dd-left">
                        <h5>{med.medicine_name}</h5>
                        <p>{med.generic_name} · {med.dosage_form} · {med.package_size}</p>
                      </div>
                      <div className="dd-right">
                        <div className="stock">{med.stock} in stock</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 font-bold text-sm">
                    {searchTerm.length > 0 ? 'No medicines found' : 'Start typing to search...'}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="form-group mt-8">
            <label>{translations.grn?.notes_optional || 'Additional notes'}</label>
            <textarea 
              className="w-full p-4 border-1.5 border-slate-100 rounded-2xl text-sm font-semibold text-slate-600 focus:outline-none focus:border-emerald-500 transition-all resize-none"
              rows={2}
              placeholder="Describe any breakage or discrepancies..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
          </div>
        </div>

        <div className="grn-footer">
          <div className="totals-row">
            <span>Total items: <strong className="text-slate-900 ml-2">{items.length} products</strong></span>
            <span>Total bill: <strong>৳{calculateGrandTotal().toLocaleString(undefined, {minimumFractionDigits: 2})}</strong></span>
          </div>
          <div className="flex gap-4">
            <button className="btn-cancel" onClick={onClose}>{translations.grn?.cancel || 'Cancel'}</button>
            <button 
              className="btn-save" 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {isEditing 
                ? translations.grn?.update_type?.replace('{type}', isPO ? 'Order' : 'GRN') || 'Update'
                : isPO 
                  ? 'Save Purchase Order' 
                  : 'Save GRN & Update Stock'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GRNForm;

