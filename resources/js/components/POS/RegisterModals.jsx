import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Banknote, 
  X, 
  ArrowRight, 
  Calculator, 
  AlertCircle,
  Hash,
  Coins,
  History,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ── Common Modal Backdrop ── */
const ModalBackdrop = ({ children, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 20 }}
      className="bg-white rounded-[2rem] shadow-2xl shadow-slate-900/20 w-full max-w-lg overflow-hidden border border-slate-100"
      onClick={e => e.stopPropagation()}
    >
      {children}
    </motion.div>
  </motion.div>
);

/* ── Open Register Modal ── */
export const OpenRegisterModal = ({ onOpen, isProcessing }) => {
  const [openingBalance, setOpeningBalance] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!openingBalance || isNaN(openingBalance)) {
      toast.error('Please enter a valid opening balance');
      return;
    }
    onOpen(parseFloat(openingBalance));
  };

  return (
    <ModalBackdrop>
      <div className="p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <Banknote size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Open Cash Register</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Start your shift session</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Opening Balance (Cash in Drawer)</label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-300 group-focus-within:text-emerald-500 transition-colors">৳</span>
              <input
                type="number"
                autoFocus
                placeholder="0.00"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-200"
              />
            </div>
            <p className="text-[10px] text-slate-400 italic">Enter the amount of cash currently in the drawer to start tracking.</p>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-slate-900/20 hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-3 group"
          >
            {isProcessing ? (
              <RefreshCw className="animate-spin" size={18} />
            ) : (
              <>
                Open Session
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>
    </ModalBackdrop>
  );
};

/* ── Close Register Modal ── */
export const CloseRegisterModal = ({ onCloseRegister, registerData, isProcessing, onClose }) => {
  const [denominations, setDenominations] = useState([
    { label: '৳ 1000', value: 1000, qty: 0 },
    { label: '৳ 500', value: 500, qty: 0 },
    { label: '৳ 200', value: 200, qty: 0 },
    { label: '৳ 100', value: 100, qty: 0 },
    { label: '৳ 50', value: 50, qty: 0 },
    { label: '৳ 20', value: 20, qty: 0 },
    { label: '৳ 10', value: 10, qty: 0 },
    { label: '৳ 5', value: 5, qty: 0 },
    { label: '৳ 2', value: 2, qty: 0 },
    { label: '৳ 1', value: 1, qty: 0 },
  ]);
  const [notes, setNotes] = useState('');

  const updateQty = (idx, qty) => {
    const newDenom = [...denominations];
    newDenom[idx].qty = parseInt(qty) || 0;
    setDenominations(newDenom);
  };

  const totalCounted = denominations.reduce((acc, curr) => acc + (curr.value * curr.qty), 0);
  const expected = registerData?.expected_cash || 0;
  const difference = totalCounted - expected;

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalDenominations = denominations
      .filter(d => d.qty > 0)
      .map(d => ({ denomination: d.value, quantity: d.qty }));

    onCloseRegister({
      counted_cash: totalCounted,
      denominations: finalDenominations,
      notes: notes
    });
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="flex flex-col h-[85vh] max-h-[700px]">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200">
                <Calculator size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Close Cash Register</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End of shift reconciliation</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-all">
              <X size={20} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-auto custom-scrollbar p-8 space-y-8">
          {/* Summary Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Expected Cash</p>
              <p className="text-lg font-black text-slate-900">৳ {expected.toLocaleString()}</p>
            </div>
            <div className={`p-4 rounded-2xl border ${difference === 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
              <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${difference === 0 ? 'text-emerald-500' : 'text-rose-500'}`}>Difference</p>
              <p className={`text-lg font-black ${difference === 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {difference > 0 ? '+' : ''} ৳ {difference.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Denominations List */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <Coins size={16} className="text-indigo-500" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Cash Denominations</h3>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {denominations.map((d, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 bg-slate-50/50 rounded-2xl border border-slate-100 group focus-within:bg-white focus-within:border-indigo-200 transition-all">
                  <span className="w-20 text-[11px] font-black text-slate-600">{d.label}</span>
                  <div className="flex-1 flex items-center gap-3">
                    <X size={10} className="text-slate-300" />
                    <input
                      type="number"
                      min="0"
                      value={d.qty || ''}
                      onChange={(e) => updateQty(idx, e.target.value)}
                      placeholder="0"
                      className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-slate-900 placeholder:text-slate-200"
                    />
                  </div>
                  <div className="w-24 text-right">
                    <span className="text-xs font-black text-slate-400">৳ {(d.value * d.qty).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notes / Discrepancy Reason</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for any difference in cash..."
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all min-h-[100px]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-slate-100 shrink-0 bg-slate-50/50">
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Total Hand Count</span>
            <span className="text-2xl font-black text-indigo-600">৳ {totalCounted.toLocaleString()}</span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-slate-900/20 hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-3 group"
          >
            {isProcessing ? (
              <RefreshCw className="animate-spin" size={18} />
            ) : (
              <>
                Finalize & Close Session
                <CheckCircle2 size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
};
