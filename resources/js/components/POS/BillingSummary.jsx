import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setPaymentMethod, holdCurrentCart, setCustomerInfo, setDiscount } from '../../store/slices/posSlice';
import { ArrowRight, Loader2, Play, Pause, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import CartTable from './CartTable';
import { useLanguage } from '../../language/GlobalTranslate.jsx';

/* ── Design tokens ── */
const T = {
  bg: '#f7f8fa', surface: '#fff', s2: '#f0f2f6', s3: '#e6e9f0',
  border: '#dde1ea', border2: '#c8cdd9',
  text: '#0e1117', text2: '#4a5068', text3: '#8890a8',
  teal: '#00897b', tealL: '#e0f2f0', tealD: '#00695c',
  blue: '#2563eb', blueL: '#eff4ff',
  amber: '#d97706', amberL: '#fef3c7',
  red: '#dc2626', redL: '#fef2f2',
  green: '#16a34a', greenL: '#f0fdf4',
  purple: '#7c3aed',
};

const payMethods = [
  { id: 'Cash',   icon: '💵', label: 'Cash' },
  { id: 'Card',   icon: '💳', label: 'Card' },
  { id: 'Online', icon: '📱', label: 'Online' },
  { id: 'Due',    icon: '📋', label: 'Due' },
];

const BillingSummary = ({ onProcess, isProcessing, onOpenResume }) => {
  const { translations } = useLanguage();
  const {
    subtotal, tax_total, tax_name, tax_rate, discount_total, grand_total,
    cart, payment_method, heldSells, customer_name, customer_phone
  } = useSelector((s) => s.pos);

  const payMethods = [
    { id: 'Cash',   icon: '💵', label: translations.pos.cash },
    { id: 'Card',   icon: '💳', label: translations.pos.card },
    { id: 'Online', icon: '📱', label: translations.pos.online },
    { id: 'Due',    icon: '📋', label: translations.pos.due },
  ];
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [cashReceived, setCashReceived] = React.useState('');
  const isEmpty = cart.length === 0;

  const changeMoney = cashReceived ? parseFloat(cashReceived) - grand_total : 0;

  const handleHold = () => {
    if (isEmpty) { toast.error('Cart is empty.'); return; }
    dispatch(holdCurrentCart());
    toast.success('Order held');
  };


  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: T.surface }}>

      {/* ── Sidebar Header ── */}
      <div className="shrink-0 px-3 py-2.5 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${T.border}` }}>
        <div className="text-[13px] font-semibold flex items-center gap-1.5" style={{ color: T.text }}>
          {translations.pos.order}
          <span className="pos-mono text-[10px] text-white px-1.5 py-px rounded-xl"
            style={{ background: T.teal }}>{cart.reduce((a, i) => a + i.quantity, 0)}</span>
        </div>
        <div className="flex gap-1">
          <button onClick={handleHold}
            className="text-[11px] py-0.5 px-2 rounded border cursor-pointer transition-all"
            style={{ border: `1px solid ${T.border}`, color: T.text2, background: 'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.background = T.s2; e.currentTarget.style.color = T.text; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.text2; }}>
            ⏸ {translations.pos.hold} {heldSells.length > 0 && <span className="text-[9px] font-bold px-1 py-px rounded-lg ml-0.5"
              style={{ background: T.amber, color: '#000' }}>{heldSells.length}</span>}
          </button>
          <button onClick={onOpenResume}
            className="text-[11px] py-0.5 px-2 rounded border cursor-pointer transition-all"
            style={{ border: `1px solid ${T.border}`, color: T.text2, background: 'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.background = T.s2; e.currentTarget.style.color = T.text; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.text2; }}>
            ▶ {translations.pos.resume}
          </button>
          <button onClick={() => dispatch({ type: 'pos/clearCart' })}
            className="text-[11px] py-0.5 px-2 rounded border cursor-pointer transition-all"
            style={{ border: `1px solid ${T.border}`, color: T.text2, background: 'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.red; e.currentTarget.style.color = T.red; e.currentTarget.style.background = T.redL; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text2; e.currentTarget.style.background = 'transparent'; }}>
            ✕ {translations.pos.clear}
          </button>
        </div>
      </div>

      {/* ── Cart Body ── */}
      <div className="flex-1 overflow-hidden">
        <CartTable />
      </div>

      {/* ── Customer Row ── */}
      <div className="shrink-0 flex gap-1.5 px-2 py-1.5" style={{ borderTop: `1px solid ${T.border}` }}>
        <input className="flex-1 py-1.5 px-2.5 rounded-md text-[11.5px] outline-none transition-colors"
          style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text }}
          placeholder={`👤  ${translations.pos.patient_name}`}
          value={customer_name === 'Walk-in Customer' ? '' : customer_name}
          onChange={(e) => dispatch(setCustomerInfo({ name: e.target.value || 'Walk-in Customer', phone: customer_phone }))}
          onFocus={e => e.currentTarget.style.borderColor = T.teal}
          onBlur={e => e.currentTarget.style.borderColor = T.border} />
        <input className="py-1.5 px-2.5 rounded-md text-[11.5px] outline-none transition-colors"
          style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text, maxWidth: 108 }}
          placeholder={`📞  ${translations.pos.phone}`}
          value={customer_phone}
          onChange={(e) => dispatch(setCustomerInfo({ name: customer_name, phone: e.target.value }))}
          onFocus={e => e.currentTarget.style.borderColor = T.teal}
          onBlur={e => e.currentTarget.style.borderColor = T.border} />
      </div>

      {/* ── Totals ── */}
      <div className="shrink-0 px-2.5 py-2" style={{ borderTop: `1px solid ${T.border}` }}>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[11px]" style={{ color: T.text2 }}>{translations.pos.subtotal}</span>
          <span className="pos-mono text-[11.5px]" style={{ color: T.text }}>৳{Number(subtotal || 0).toFixed(2)}</span>
        </div>
        {tax_rate > 0 && (
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px]" style={{ color: T.text2 }}>{tax_name} ({tax_rate}%)</span>
            <span className="pos-mono text-[11.5px]" style={{ color: T.blue }}>+৳{Number(tax_total || 0).toFixed(2)}</span>
          </div>
        )}

        {/* Grand Total */}
        <div className="flex justify-between items-center pt-1.5" style={{ borderTop: `1px solid ${T.border}` }}>
          <span className="text-[13px] font-semibold" style={{ color: T.text }}>{translations.pos.total}</span>
          <span className="pos-mono text-xl font-semibold" style={{ color: T.teal }}>৳{Number(grand_total || 0).toFixed(2)}</span>
        </div>
      </div>

      {/* ── Payment Section ── */}
      <div className="shrink-0 px-2 py-1.5" style={{ borderTop: `1px solid ${T.border}` }}>
        <div className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color: T.text3, letterSpacing: '0.5px' }}>{translations.pos.payment_method}</div>
        <div className="grid grid-cols-4 gap-1 mb-2">
          {payMethods.map(({ id, icon, label }) => {
            const isOn = payment_method === id;
            return (
              <button key={id}
                onClick={() => dispatch(setPaymentMethod(id))}
                className="py-1.5 px-1 rounded-lg text-[10.5px] font-medium text-center cursor-pointer transition-all"
                style={{
                  background: isOn ? T.blueL : T.bg,
                  border: `1.5px solid ${isOn ? T.blue : T.border}`,
                  color: isOn ? T.blue : T.text2,
                }}>
                <span className="text-sm block mb-0.5">{icon}</span>
                {label}
              </button>
            );
          })}
        </div>

        {/* Cash row (only for Cash) */}
        {payment_method === 'Cash' && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px]" style={{ color: T.text3 }}>{translations.pos.received}</span>
              <input type="number" placeholder="0.00"
                className="pos-mono py-1.5 px-2 rounded text-xs outline-none w-full"
                style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text }}
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                onFocus={e => e.currentTarget.style.borderColor = T.teal}
                onBlur={e => e.currentTarget.style.borderColor = T.border} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px]" style={{ color: T.text3 }}>{translations.pos.change}</span>
              <div className="pos-mono py-1.5 px-2 rounded text-xs w-full"
                style={{
                  background: changeMoney < 0 ? T.redL : T.greenL,
                  border: `1px solid ${changeMoney < 0 ? '#fecaca' : '#bbf7d0'}`,
                  color: changeMoney < 0 ? T.red : T.green,
                }}>
                ৳{changeMoney >= 0 ? Number(changeMoney).toFixed(2) : '0.00'}
              </div>
            </div>
          </div>
        )}
      </div>


      {/* ── Complete Button ── */}
      <div className="shrink-0 px-2 pb-2">
        <button
          onClick={onProcess}
          disabled={isEmpty || isProcessing}
          className="w-full py-2.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          style={{
            background: isEmpty || isProcessing ? T.s3 : T.teal,
            border: 'none',
            color: isEmpty || isProcessing ? T.text3 : '#fff',
            cursor: isEmpty || isProcessing ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={e => { if (!isEmpty && !isProcessing) e.currentTarget.style.background = T.tealD; }}
          onMouseLeave={e => { if (!isEmpty && !isProcessing) e.currentTarget.style.background = T.teal; }}>
          {isProcessing ? (
            <><Loader2 size={16} className="animate-spin" /> {translations.pos.processing}</>
          ) : (
            <>{translations.pos.complete_order}</>
          )}
        </button>
      </div>
    </div>
  );
};

export default BillingSummary;
