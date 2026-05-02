import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setPaymentMethod, holdCurrentCart, setCustomerInfo } from '../../store/slices/posSlice';
import { ArrowRight, CreditCard, Wallet, Banknote, Loader2, Receipt, Pause, Play, User, Phone, CircleDollarSign, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

/* ── tiny inline shimmer keyframes injected once ── */
const shimmerStyle = `
@keyframes pos-shimmer {
  from { left: -100%; }
  to   { left:  100%; }
}
@keyframes pos-pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
`;

const payMethods = [
  { id: 'Cash',   label: 'Cash',   Icon: Banknote,   active: { bg: 'rgba(232,146,42,0.12)', border: 'rgba(232,146,42,0.35)', text: '#e8922a' } },
  { id: 'Card',   label: 'Card',   Icon: CreditCard,  active: { bg: 'rgba(74,144,217,0.12)', border: 'rgba(74,144,217,0.35)', text: '#4a90d9' } },
  { id: 'Online', label: 'Online', Icon: Wallet,      active: { bg: 'rgba(58,170,114,0.12)', border: 'rgba(58,170,114,0.35)', text: '#3aaa72' } },
  { id: 'Due',    label: 'Due',    Icon: CircleDollarSign, active: { bg: 'rgba(217,85,85,0.12)', border: 'rgba(217,85,85,0.35)', text: '#d95555' } },
];

const BillingSummary = ({ onProcess, isProcessing, onOpenResume }) => {
  const { subtotal, tax_total, tax_name, tax_rate, discount_total, grand_total, cart, payment_method, heldSells, customer_name, customer_phone } = useSelector((s) => s.pos);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [cashReceived, setCashReceived] = React.useState('');
  const isEmpty = cart.length === 0;

  const changeMoney = cashReceived ? parseFloat(cashReceived) - grand_total : 0;

  const handleHold = () => {
    if (isEmpty) {
      toast.error('Cart is empty — nothing to hold.');
      return;
    }
    dispatch(holdCurrentCart());
    toast.success('Sell held successfully');
  };

  return (
    <>
      <style>{shimmerStyle}</style>
      <div
        className="flex flex-col h-full rounded-2xl overflow-hidden relative"
        style={{
          background: 'linear-gradient(175deg, #162035 0%, #0f1b2d 60%, #0a1525 100%)',
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.13), 0 4px 12px rgba(0,0,0,0.07)',
        }}
      >
        {/* Decorative blobs */}
        <div className="absolute pointer-events-none" style={{ top: -60, right: -60, width: 200, height: 200, background: 'radial-gradient(circle, rgba(201,151,42,0.18) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div className="absolute pointer-events-none" style={{ bottom: -40, left: -40, width: 160, height: 160, background: 'radial-gradient(circle, rgba(74,144,217,0.10) 0%, transparent 70%)', borderRadius: '50%' }} />
        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

        {/* ── Header ── */}
        <div className="relative z-10 flex items-center gap-3 px-6 py-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #e8b84b, #c9972a)', boxShadow: '0 4px 12px rgba(201,151,42,0.35)' }}>
            <Receipt size={18} style={{ color: '#1a0d00' }} />
          </div>
          <div>
            <h3 className="font-semibold leading-none" style={{ color: '#fff', fontFamily: "'Playfair Display', serif", fontSize: 16 }}>
              Billing Summary
            </h3>
            <p className="text-[9px] font-semibold mt-1 uppercase tracking-[0.14em]" style={{ color: '#e8b84b' }}>
              Order Review
            </p>
          </div>

          {/* Due Shortcut Button */}
          <button 
            onClick={() => navigate('/sales-history', { state: { showDueOnly: true } })}
            className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all hover:bg-orange-500/10 border border-orange-500/20 group"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 group-hover:text-orange-300">View Due</span>
            <ExternalLink size={10} className="text-orange-500/50" />
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 px-6 py-2 space-y-4">
          
          {/* Top Controls */}
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[0.12em] mb-2 text-white/30">Session Controls</div>
            <div className="flex gap-2">
              <button
                onClick={handleHold}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold transition-all"
                style={{ background: 'rgba(232,146,42,0.1)', border: '1px solid rgba(232,146,42,0.2)', color: '#e8922a' }}
              >
                <Pause size={12} /> Hold
              </button>
              <button
                onClick={onOpenResume}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold transition-all relative"
                style={{ background: 'rgba(58,170,114,0.1)', border: '1px solid rgba(58,170,114,0.2)', color: '#3aaa72' }}
              >
                <Play size={12} /> Resume
                {heldSells.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#e8922a] text-[#1a0a00] text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-lg">
                    {heldSells.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="h-px bg-white/5" />

          {/* Customer Info */}
          <div className="space-y-2.5">
            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/30">Customer Details</div>
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={12} />
                <input
                  type="text"
                  placeholder="Name (Optional)"
                  value={customer_name}
                  onChange={(e) => dispatch(setCustomerInfo({ name: e.target.value, phone: customer_phone }))}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs outline-none bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-amber-500/50 transition-all"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={12} />
                <input
                  type="text"
                  placeholder="Phone (Optional)"
                  value={customer_phone}
                  onChange={(e) => dispatch(setCustomerInfo({ name: customer_name, phone: e.target.value }))}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs outline-none bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-amber-500/50 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-white/5" />

          {/* Payment Calculator */}
          <div className="space-y-2.5">
            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/30">Change Calculator</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] text-white/40 ml-1">Received</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg text-xs font-bold outline-none bg-white/5 border border-white/10 text-[#3aaa72] focus:border-[#3aaa72]/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-white/40 ml-1">Change</label>
                <div className="w-full px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/5 border border-amber-500/10 text-amber-500">
                  ৳ {changeMoney > 0 ? changeMoney.toFixed(2) : '0.00'}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ── Bottom Section (Totals & Payment) ── */}
        <div className="relative z-10 shrink-0 px-6 pt-4 pb-6 space-y-4" style={{ background: 'rgba(0,0,0,0.1)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          
          {/* Subtotal & Tax */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Subtotal</span>
              <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>৳{subtotal.toFixed(2)}</span>
            </div>
            {tax_rate > 0 && (
              <div className="flex justify-between items-center px-1">
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{tax_name || 'Tax'} ({tax_rate}%)</span>
                <span className="text-sm font-semibold" style={{ color: '#4a90d9' }}>+ ৳{tax_total.toFixed(2)}</span>
              </div>
            )}
            {discount_total > 0 && (
              <div className="flex justify-between items-center px-1">
                <span className="text-xs" style={{ color: '#3aaa72' }}>Discount</span>
                <span className="text-sm font-semibold" style={{ color: '#3aaa72' }}>- ৳{discount_total.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="h-px mx-1" style={{ background: 'rgba(255,255,255,0.08)' }} />

          {/* To Pay box */}
          <div className="relative rounded-xl px-4 py-3.5 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #243452 0%, rgba(36,52,82,0.6) 100%)', border: '1px solid rgba(255,255,255,0.10)' }}>
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(201,151,42,0.5), transparent)' }} />
            <div className="flex justify-between items-center mb-1">
              <span className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: '#e8b84b' }}>To pay</span>
              <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>incl. all taxes</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.50)' }}>৳</span>
              <span style={{ color: '#fff', fontSize: 26, fontWeight: 700, fontFamily: "'Playfair Display', serif", letterSpacing: '-0.02em', lineHeight: 1 }}>
                ৳ {grand_total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="grid grid-cols-4 gap-1.5">
            {payMethods.map(({ id, label, Icon, active }) => {
              const isActive = payment_method === id;
              return (
                <button
                  key={id}
                  onClick={() => dispatch(setPaymentMethod(id))}
                  className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition-all"
                  style={{
                    background: isActive ? active.bg : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isActive ? active.border : 'rgba(255,255,255,0.08)'}`,
                    color: isActive ? active.text : 'rgba(255,255,255,0.40)',
                  }}
                >
                  <Icon size={13} />
                  <span className="text-[8px] font-bold uppercase tracking-widest">{label}</span>
                </button>
              );
            })}
          </div>

          {/* Complete Button */}
          <button
            onClick={onProcess}
            disabled={isEmpty || isProcessing}
            className="w-full relative overflow-hidden flex items-center justify-between px-5 py-3.5 rounded-xl transition-all mt-2"
            style={{
              background: isEmpty || isProcessing
                ? 'rgba(255,255,255,0.07)'
                : 'linear-gradient(135deg, #e8b84b 0%, #c9972a 100%)',
              border: 'none',
              color: isEmpty || isProcessing ? 'rgba(255,255,255,0.25)' : '#1a0d00',
              fontFamily: 'Outfit, sans-serif',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.04em',
              cursor: isEmpty || isProcessing ? 'not-allowed' : 'pointer',
              boxShadow: isEmpty || isProcessing ? 'none' : '0 4px 16px rgba(201,151,42,0.40)',
            }}
            onMouseEnter={e => { if (!isEmpty && !isProcessing) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {/* Shimmer sweep */}
            {!isEmpty && !isProcessing && (
              <div className="absolute inset-0 pointer-events-none" style={{ overflow: 'hidden', borderRadius: 12 }}>
                <div style={{
                  position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                  animation: 'pos-shimmer 2.8s infinite'
                }} />
              </div>
            )}
            <span>
              {isProcessing ? 'Processing…' : 'Complete order'}
            </span>
            {isProcessing
              ? <Loader2 size={18} className="animate-spin" />
              : <ArrowRight size={18} />
            }
          </button>
        </div>
      </div>
    </>
  );
};

export default BillingSummary;
