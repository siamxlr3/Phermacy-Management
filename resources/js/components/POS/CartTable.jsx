import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeItem, updateQuantity, updateItemUnit, updateItemPrice } from '../../store/slices/posSlice';
import { Minus, Plus, X, ShoppingCart, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../language/GlobalTranslate.jsx';

/* ── Design tokens ── */
const T = {
  bg: '#f7f8fa', surface: '#fff', s2: '#f0f2f6', s3: '#e6e9f0',
  border: '#dde1ea', border2: '#c8cdd9',
  text: '#0e1117', text2: '#4a5068', text3: '#8890a8',
  teal: '#00897b', tealL: '#e0f2f0', tealD: '#00695c',
  blue: '#2563eb', blueL: '#eff4ff',
  purple: '#7c3aed', purpleL: '#f5f3ff',
  red: '#dc2626',
};

const GROUP_A = ['Tablet', 'Capsule', 'Suppository', 'Patch'];

const CartTable = () => {
  const { translations } = useLanguage();
  const { cart } = useSelector((state) => state.pos);
  const dispatch = useDispatch();

  /* ── Empty State ── */
  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-1.5" style={{ color: T.text3 }}>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-1"
          style={{ border: `1.5px dashed ${T.border2}` }}>
          <span className="text-xl">🛒</span>
        </div>
        <span className="text-xs font-medium">{translations.pos.cart_empty}</span>
        <span className="text-[11px]">{translations.pos.tap_to_add}</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-2 py-1.5"
      style={{ scrollbarWidth: 'thin', scrollbarColor: `${T.border} transparent` }}>
      <AnimatePresence initial={false}>
        {cart.map((item) => {
          const isGA = GROUP_A.includes(item.dosage_form);
          const lineTotal = (Number(item.price_per_unit || 0) * item.quantity).toFixed(2);
          const currentUnit = item.unit;

          // Build breakdown text
          let breakdown = '';
          if (isGA) {
            const tps = item.tablets_per_strip || 1;
            const spb = item.strips_per_box || 1;
            if (currentUnit === 'Tablet') {
              breakdown = `1 ${translations.pos.unit_tablet} · ৳${Number(item.price_per_unit || 0).toFixed(2)}`;
            } else if (currentUnit === 'Strip') {
              breakdown = `${tps} ${translations.pos.tabs_per_strip} · ৳${Number(item.price_per_tablet || 0).toFixed(2)} × ${tps}`;
            } else {
              breakdown = `${spb} ${translations.pos.unit_strip}s · ${tps * spb} ${translations.pos.tabs} · ৳${Number(item.price_per_stripe || 0).toFixed(2)}/${translations.pos.unit_strip}`;
            }
          } else {
            breakdown = `${item.dosage_form || 'Unit'} · ৳${Number(item.price_per_unit || 0).toFixed(2)}`;
          }

          // Unit colors
          const getUnitStyle = (u, isOn) => {
            if (!isOn) return { background: T.surface, border: `1px solid ${T.border}`, color: T.text2 };
            if (u === 'Tablet') return { background: T.tealL, border: `1px solid ${T.teal}`, color: T.tealD };
            if (u === 'Strip') return { background: T.blueL, border: `1px solid ${T.blue}`, color: T.blue };
            return { background: T.purpleL, border: `1px solid ${T.purple}`, color: T.purple };
          };

          return (
            <motion.div
              key={`${item.medicine_id}-${item.unit}`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0, padding: 0, overflow: 'hidden' }}
              transition={{ duration: 0.15 }}
              className="rounded-lg p-2 mb-1.5"
              style={{ background: T.bg, border: `1px solid ${T.border}` }}>

              {/* Row 1: name + delete */}
              <div className="flex justify-between items-start mb-1.5">
                <div className="text-[11.5px] font-medium flex-1 mr-1.5 leading-tight" style={{ color: T.text }}>
                  {item.name}
                </div>
                <span className="cursor-pointer text-[11px] leading-none px-0.5 py-0.5 rounded transition-colors"
                  style={{ color: T.text3 }}
                  onClick={() => dispatch(removeItem({ medicine_id: item.medicine_id, unit: item.unit }))}
                  onMouseEnter={e => e.currentTarget.style.color = T.red}
                  onMouseLeave={e => e.currentTarget.style.color = T.text3}>
                  ✕
                </span>
              </div>

              {/* Row 2: unit switcher + qty stepper + price */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Unit Switchers */}
                {isGA ? (
                  ['Tablet', 'Strip', 'Box'].map(u => (
                    <button key={u}
                      onClick={() => dispatch(updateItemUnit({ medicine_id: item.medicine_id, oldUnit: currentUnit, newUnit: u }))}
                      className="py-0.5 px-1.5 rounded text-[10px] font-medium transition-all cursor-pointer whitespace-nowrap"
                      style={getUnitStyle(u, currentUnit === u)}>
                      {u === 'Tablet' ? translations.pos.piece : (u === 'Strip' ? translations.pos.strip : translations.pos.box)}
                    </button>
                  ))
                ) : (
                  <span className="py-0.5 px-1.5 rounded text-[10px] font-medium"
                    style={{ background: T.tealL, border: `1px solid ${T.teal}`, color: T.tealD }}>
                    {item.dosage_form || 'Unit'}
                  </span>
                )}

                {/* Spacer */}
                <div className="flex-1" />

                {/* Qty stepper */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => dispatch(updateQuantity({ medicine_id: item.medicine_id, unit: item.unit, quantity: item.quantity - 1 }))}
                    className="w-5 h-5 flex items-center justify-center rounded text-xs cursor-pointer transition-all"
                    style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text2 }}
                    onMouseEnter={e => { e.currentTarget.style.background = T.s3; e.currentTarget.style.color = T.text; }}
                    onMouseLeave={e => { e.currentTarget.style.background = T.surface; e.currentTarget.style.color = T.text2; }}>
                    −
                  </button>
                  <span className="pos-mono text-[11px] font-medium min-w-[16px] text-center" style={{ color: T.text }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => dispatch(updateQuantity({ medicine_id: item.medicine_id, unit: item.unit, quantity: item.quantity + 1 }))}
                    className="w-5 h-5 flex items-center justify-center rounded text-xs cursor-pointer transition-all"
                    style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text2 }}
                    onMouseEnter={e => { e.currentTarget.style.background = T.s3; e.currentTarget.style.color = T.text; }}
                    onMouseLeave={e => { e.currentTarget.style.background = T.surface; e.currentTarget.style.color = T.text2; }}>
                    +
                  </button>
                </div>

                {/* Line price */}
                <span className="pos-mono text-xs font-semibold whitespace-nowrap" style={{ color: T.text }}>
                  ৳{lineTotal}
                </span>
              </div>

              {/* Breakdown */}
              <div className="pos-mono text-[10px] mt-1" style={{ color: T.text3 }}>
                {breakdown}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default CartTable;
