import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setDiscount, setPaymentMethod } from '../../store/slices/posSlice';
import { Receipt, Tag, ArrowRight, CreditCard, Wallet, Banknote, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const BillingSummary = ({ onProcess, isProcessing }) => {
  const { subtotal, tax_total, tax_name, tax_rate, discount_total, grand_total, cart, payment_method } = useSelector((state) => state.pos);
  const dispatch = useDispatch();

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-2xl shadow-xl overflow-hidden text-white p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
          <Receipt size={20} className="text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold tracking-tight text-white">Billing Summary</h3>
          <p className="text-xs text-slate-400 font-medium font-outfit uppercase tracking-widest">Order Review</p>
        </div>
      </div>

      <div className="space-y-6 flex-1">
        {/* Price Breakdown */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-sm font-medium text-slate-400">Subtotal</span>
            <span className="text-sm font-bold text-white tracking-tight">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center px-1">
            <span className="text-sm font-medium text-slate-400">{tax_name} ({tax_rate}%)</span>
            <span className="text-sm font-bold text-blue-400 tracking-tight">+ ${tax_total.toFixed(2)}</span>
          </div>
          <div className="relative group">
            <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400/50 group-hover:text-emerald-400 transition-colors" />
            <input
              type="number"
              placeholder="Discount Amount"
              value={discount_total || ''}
              onChange={(e) => dispatch(setDiscount(parseFloat(e.target.value) || 0))}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-emerald-400 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="h-px bg-slate-800/50 my-6" />

        {/* Grand Total */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-black text-blue-400 uppercase tracking-[2px]">To Pay</span>
            <span className="text-[10px] font-bold text-slate-500 italic">Inclusive of all taxes</span>
          </div>
          <div className="text-4xl font-black text-white tracking-tighter">
            ${grand_total.toFixed(2)}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => dispatch(setPaymentMethod('Cash'))}
            className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-xl transition-all border",
                payment_method === 'Cash' 
                    ? "bg-amber-500/10 border-amber-500/50" 
                    : "bg-slate-800/40 border-slate-700/50 hover:bg-slate-700/50"
            )}
          >
            <Banknote size={16} className={payment_method === 'Cash' ? "text-amber-400" : "text-slate-400"} />
            <span className={cn("text-[10px] font-bold uppercase tracking-wider", payment_method === 'Cash' ? "text-amber-400" : "text-slate-400")}>Cash</span>
          </button>
          
          <button 
            onClick={() => dispatch(setPaymentMethod('Card'))}
            className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-xl transition-all border",
                payment_method === 'Card' 
                    ? "bg-blue-500/10 border-blue-500/50" 
                    : "bg-slate-800/40 border-slate-700/50 hover:bg-slate-700/50"
            )}
          >
            <CreditCard size={16} className={payment_method === 'Card' ? "text-blue-400" : "text-slate-400"} />
            <span className={cn("text-[10px] font-bold uppercase tracking-wider", payment_method === 'Card' ? "text-blue-400" : "text-slate-400")}>Card</span>
          </button>

          <button 
            onClick={() => dispatch(setPaymentMethod('Online'))}
            className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-xl transition-all border",
                payment_method === 'Online' 
                    ? "bg-emerald-500/10 border-emerald-500/50" 
                    : "bg-slate-800/40 border-slate-700/50 hover:bg-slate-700/50"
            )}
          >
            <Wallet size={16} className={payment_method === 'Online' ? "text-emerald-400" : "text-slate-400"} />
            <span className={cn("text-[10px] font-bold uppercase tracking-wider", payment_method === 'Online' ? "text-emerald-400" : "text-slate-400")}>Online</span>
          </button>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={onProcess}
        disabled={cart.length === 0 || isProcessing}
        className="w-full mt-8 group relative overflow-hidden bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 py-4 px-6 rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98]"
      >
        <div className="flex items-center justify-center gap-3 relative z-10">
          {isProcessing ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>
              <span className="font-bold text-white">Complete & Generate Invoice</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </div>
      </button>
    </div>
  );
};

export default BillingSummary;
