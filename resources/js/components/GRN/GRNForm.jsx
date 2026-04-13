import React, { useState, useEffect } from 'react';
import { useGetReceivedPurchaseOrdersQuery, useGetPurchaseOrderDetailsQuery, useAddGRNMutation, useUpdateGRNMutation } from '../../store/api/grnApi';
import { X, Receipt, Search, User, Package, Calculator, Loader2, CheckCircle2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

const GRNForm = ({ onClose, grn }) => {
  const isEditing = !!grn;

  const [selectedPOId, setSelectedPOId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);

  const { data: receivedOrdersData } = useGetReceivedPurchaseOrdersQuery();
  const { data: poDetailsData, isFetching: loadingPO } = useGetPurchaseOrderDetailsQuery(selectedPOId, {
    skip: !selectedPOId || isEditing  // skip PO fetch when editing — items already pre-filled
  });

  const [addGRN, { isLoading: isAdding }] = useAddGRNMutation();
  const [updateGRN, { isLoading: isUpdating }] = useUpdateGRNMutation();
  const isSubmitting = isAdding || isUpdating;

  const receivedOrders = receivedOrdersData?.data || [];

  // Pre-fill form if editing
  useEffect(() => {
    if (grn) {
      setSelectedPOId(String(grn.purchase_order_id));
      setInvoiceNumber(grn.invoice_number || '');
      setReceivedBy(grn.received_by || '');
      setReceivedDate(grn.received_date || new Date().toISOString().split('T')[0]);
      setNotes(grn.notes || '');
      setItems(
        (grn.items || []).map(item => ({
          medicine_id: item.medicine_id,
          medicine_name: item.medicine_name,
          batch_number: item.batch_number,
          expiry_date: item.expiry_date,
          qty_boxes_received: item.qty_boxes_received,
          unit_cost: item.unit_cost,
          subtotal: item.subtotal,
        }))
      );
    }
  }, [grn]);

  // Populate items from PO when creating new
  useEffect(() => {
    if (!isEditing && poDetailsData?.data?.items) {
      setItems(poDetailsData.data.items.map(item => ({
        medicine_id: item.medicine_id,
        medicine_name: item.medicine?.name || 'Unknown',
        qty_ordered: item.qty_boxes,
        qty_boxes_received: item.qty_boxes,
        unit_cost: item.unit_cost,
        batch_number: '',
        expiry_date: '',
        subtotal: item.qty_boxes * item.unit_cost
      })));
    }
  }, [poDetailsData, isEditing]);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    const item = { ...newItems[index] };
    item[field] = value;
    if (field === 'qty_boxes_received' || field === 'unit_cost') {
      item.subtotal = (parseFloat(item.qty_boxes_received) || 0) * (parseFloat(item.unit_cost) || 0);
    }
    newItems[index] = item;
    setItems(newItems);
  };

  const calculateGrandTotal = () => items.reduce((sum, item) => sum + (parseFloat(item.subtotal) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!receivedBy) { toast.error('Received By is required'); return; }
    if (items.some(i => !i.batch_number || !i.expiry_date)) {
      toast.error('Batch number and expiry date are required for all items');
      return;
    }

    const payload = {
      purchase_order_id: selectedPOId,
      received_date: receivedDate,
      invoice_number: invoiceNumber,
      received_by: receivedBy,
      total_amount: calculateGrandTotal(),
      notes,
      items,
    };

    try {
      if (isEditing) {
        await updateGRN({ id: grn.id, ...payload }).unwrap();
        toast.success('GRN updated and stock re-applied');
      } else {
        await addGRN(payload).unwrap();
        toast.success('Goods received and stock updated');
      }
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save GRN');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="shrink-0 px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-lg ${isEditing ? 'bg-amber-500 shadow-amber-200' : 'bg-blue-600 shadow-blue-200'}`}>
            {isEditing ? <Edit2 size={20} /> : <Package size={20} />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{isEditing ? 'Edit GRN' : 'Goods Receipt Note (GRN)'}</h3>
            <p className="text-xs text-slate-400 font-medium">
              {isEditing ? `Editing GRN — PO ${grn.purchase_order?.po_number || '#' + grn.purchase_order_id}` : 'Record incoming batch inventory against PO'}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <X size={20} className="text-slate-400" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {/* Step 1: Header fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {!isEditing && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Select Purchase Order</label>
              <div className="relative">
                <Receipt size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
                <select
                  required
                  value={selectedPOId}
                  onChange={(e) => setSelectedPOId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                >
                  <option value="">Select Received PO</option>
                  {receivedOrders.map(po => (
                    <option key={po.id} value={po.id}>
                      {po.po_number || `PO #${po.id}`} - {po.supplier?.name} (৳{parseFloat(po.total_amount).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {isEditing && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Purchase Order</label>
              <div className="px-4 py-3 text-sm bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-bold">
                {grn.purchase_order?.po_number || `PO #${grn.purchase_order_id}`} — {grn.purchase_order?.supplier?.name}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Received By</label>
            <div className="relative">
              <User size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Name of the receiving officer"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Received Date</label>
            <input
              type="date"
              required
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
              className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Supplier Invoice # (Optional)</label>
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="INV-XXXXX"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Items */}
        {loadingPO ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="animate-spin text-blue-500 mb-2" size={32} />
            <p className="text-sm font-medium text-slate-400">Loading order items...</p>
          </div>
        ) : (selectedPOId || isEditing) && items.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Calculator size={16} className="text-blue-500" />
                {isEditing ? 'Edit Received Items' : 'Receive Items'}
              </h4>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="bg-slate-50/40 p-4 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-700">{item.medicine_name}</span>
                    {item.qty_ordered && (
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase">Ordered: {item.qty_ordered} boxes</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Batch Number</span>
                      <input
                        type="text"
                        placeholder="BATCH-001"
                        value={item.batch_number}
                        onChange={(e) => handleItemChange(index, 'batch_number', e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Expiry Date</span>
                      <input
                        type="date"
                        value={item.expiry_date}
                        onChange={(e) => handleItemChange(index, 'expiry_date', e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Qty Received</span>
                      <input
                        type="number"
                        min="1"
                        value={item.qty_boxes_received}
                        onChange={(e) => handleItemChange(index, 'qty_boxes_received', e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1 text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Subtotal</span>
                      <div className="px-3 py-2 text-sm bg-slate-100 border border-slate-100 rounded-lg text-right font-bold text-slate-600">
                        ৳{parseFloat(item.subtotal || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : !isEditing && !selectedPOId ? (
          <div className="py-20 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-sm font-bold text-slate-400">Select a Purchase Order to begin receiving</p>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Additional Notes</label>
          <textarea
            placeholder="Add delivery instructions or condition notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all resize-none"
          />
        </div>
      </form>

      {/* Action Footer */}
      <div className="shrink-0 p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">Total Received Value</span>
          <span className="text-2xl font-black text-slate-900 leading-none mt-1">
            ৳{calculateGrandTotal().toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-700 transition-all">
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || (!isEditing && !selectedPOId)}
            className={`inline-flex items-center gap-2 px-8 py-3 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 ${isEditing ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
            {isEditing ? 'Update GRN' : 'Verify & Save GRN'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GRNForm;
