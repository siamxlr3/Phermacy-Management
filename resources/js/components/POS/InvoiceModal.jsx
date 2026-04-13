import React from 'react';
import { X, Printer, CheckCircle2, ShoppingBag, Calendar, User, Phone, MapPin } from 'lucide-react';
import { format } from 'date-fns';

const InvoiceModal = ({ sale, onClose }) => {
  if (!sale) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl shadow-slate-900/50 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Receipt Header (Modal Style) */}
        <div className="shrink-0 p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sale Completed!</h2>
              <p className="text-sm font-medium text-slate-400">Invoice #{sale.invoice_number} has been generated</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Invoice Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar" id="printable-receipt">
          {/* Pharmacy Branding */}
          <div className="text-center mb-10 pb-8 border-b-2 border-dashed border-slate-100">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-1">Medisync Central Pharmacy</h3>
            <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-2">
              <span className="flex items-center gap-1"><MapPin size={10} /> 123 Health Ave, Dhaka</span>
              <span className="flex items-center gap-1"><Phone size={10} /> +880 1711-234567</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-10">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Customer</span>
              <p className="text-sm font-bold text-slate-700 flex items-center gap-2"><User size={14} className="text-slate-300" /> Walk-in Customer</p>
            </div>
            <div className="space-y-1 text-right">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Sale Date</span>
              <p className="text-sm font-bold text-slate-700 flex items-center justify-end gap-2">{format(new Date(sale.sale_date), 'MMM dd, yyyy')} <Calendar size={14} className="text-slate-300" /></p>
            </div>
          </div>

          {/* Line Items */}
          <div className="mb-10">
            <div className="flex items-center justify-between px-2 mb-4 pb-2 border-b border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Description</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Total</span>
            </div>
            <div className="space-y-4">
              {sale.items?.map((item, idx) => (
                <div key={idx} className="flex items-start justify-between px-2 group">
                  <div className="max-w-[70%]">
                    <p className="text-sm font-bold text-slate-800 mb-0.5">{item.medicine_name}</p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {item.qty_tablets} Tablets — ${item.unit_price} each
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">${parseFloat(item.subtotal).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Totals */}
          <div className="bg-slate-50 rounded-2xl p-6 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-slate-500">Subtotal</span>
              <span className="font-bold text-slate-800">${parseFloat(sale.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-slate-500">Total Tax</span>
              <span className="font-bold text-blue-600">+ ${parseFloat(sale.tax_total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-3">
              <span className="font-bold text-slate-500">Discount</span>
              <span className="font-bold text-emerald-600">- ${parseFloat(sale.discount_total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-lg font-black text-slate-900 tracking-tight">Paid via {sale.payment_method}</span>
              <span className="text-3xl font-black text-slate-900 tracking-tighter">${parseFloat(sale.grand_total).toFixed(2)}</span>
            </div>
          </div>

          <div className="text-center mt-12 mb-6">
            <p className="text-[11px] font-bold text-slate-400 italic">Thank you for your business. Please check medicine expiry before use.</p>
          </div>
        </div>

        {/* Modal Footer (Actions) */}
        <div className="shrink-0 p-8 border-t border-slate-100 flex gap-4 bg-slate-50/50">
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-3 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all shadow-xl shadow-slate-900/10 active:scale-95 translate-y-0 active:translate-y-0.5"
          >
            <Printer size={18} /> Print Receipt
          </button>
          <button
            onClick={onClose}
            className="px-10 py-4 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-2xl font-bold transition-all active:scale-95 translate-y-0 active:translate-y-0.5"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
