import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeItem, updateQuantity } from '../../store/slices/posSlice';
import { Trash2, Plus, Minus, Package, Tablet, Layers, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const unitConfig = {
  Box:   { icon: Package, label: 'Box',   color: '#0f1b2d', bg: 'rgba(15,27,45,0.08)',  border: 'rgba(15,27,45,0.15)' },
  Strip: { icon: Layers,  label: 'Strip', color: '#4a90d9', bg: 'rgba(74,144,217,0.10)', border: 'rgba(74,144,217,0.25)' },
  Tablet:{ icon: Tablet,  label: 'Tab',   color: '#c9972a', bg: 'rgba(201,151,42,0.10)', border: 'rgba(201,151,42,0.28)' },
};

const CartTable = () => {
  const { cart } = useSelector((state) => state.pos);
  const dispatch = useDispatch();

  /* ── Empty State ── */
  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-8"
        style={{ background: '#f8f8fa' }}>
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: '#e8e8eb', border: '1px solid rgba(0,0,0,0.09)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
        >
          <ShoppingCart size={28} style={{ color: '#8a8a94' }} />
        </motion.div>
        <div className="text-center">
          <p className="text-sm font-semibold" style={{ color: '#4a4a52' }}>Cart is empty</p>
          <p className="text-xs mt-1" style={{ color: '#8a8a94' }}>Search and add medicines above to start billing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#f8f8fa' }}>
      {/* Sticky header */}
      <div className="shrink-0 grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 sticky top-0 z-10"
        style={{ background: '#f0f0f3', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        {['Medicine & unit', 'Qty', 'Unit price', 'Total', ''].map((h, i) => (
          <span key={i} className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: '#8a8a94', textAlign: i > 0 ? 'center' : 'left' }}>
            {h}
          </span>
        ))}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 custom-scrollbar">
        <AnimatePresence initial={false}>
          {cart.map((item) => {
            const cfg = unitConfig[item.unit] || unitConfig.Tablet;
            const Icon = cfg.icon;
            const lineTotal = (item.price_per_unit * item.quantity).toFixed(2);

            return (
              <motion.div
                key={`${item.medicine_id}-${item.unit}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 30, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all"
                style={{
                  background: '#f0f0f3',
                  border: '1px solid rgba(0,0,0,0.07)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,151,42,0.35)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.07)'; }}
              >
                {/* Medicine info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#1a1a1f' }}>{item.name}</p>
                  <p className="text-[10px] mt-0.5 truncate" style={{ color: '#8a8a94' }}>{item.manufacturer}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
                      <Icon size={10} />
                      {cfg.label}
                      {item.unit === 'Box' && ` · ${item.strips_per_box} strips`}
                      {item.unit === 'Strip' && ` · ${item.tablets_per_strip} tabs`}
                    </span>
                  </div>
                </div>

                {/* Qty stepper */}
                <div className="flex items-center gap-2 px-2 py-1 rounded-lg"
                  style={{ background: '#e8e8eb', border: '1px solid rgba(0,0,0,0.09)' }}>
                  <button
                    onClick={() => dispatch(updateQuantity({ medicine_id: item.medicine_id, unit: item.unit, quantity: item.quantity - 1 }))}
                    className="w-6 h-6 flex items-center justify-center rounded-md transition-all"
                    style={{ color: '#4a4a52' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,151,42,0.15)'; e.currentTarget.style.color = '#c9972a'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4a4a52'; }}
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-sm font-bold min-w-[20px] text-center" style={{ color: '#1a1a1f' }}>{item.quantity}</span>
                  <button
                    onClick={() => dispatch(updateQuantity({ medicine_id: item.medicine_id, unit: item.unit, quantity: item.quantity + 1 }))}
                    className="w-6 h-6 flex items-center justify-center rounded-md transition-all"
                    style={{ color: '#4a4a52' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,151,42,0.15)'; e.currentTarget.style.color = '#c9972a'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4a4a52'; }}
                  >
                    <Plus size={12} />
                  </button>
                </div>

                {/* Unit price */}
                <span className="text-sm font-medium w-16 text-right" style={{ color: '#4a4a52' }}>
                  ${item.price_per_unit.toFixed(2)}
                </span>

                {/* Line total */}
                <span className="text-sm font-bold w-16 text-right" style={{ color: '#1a1a1f' }}>
                  ${lineTotal}
                </span>

                {/* Remove */}
                <button
                  onClick={() => dispatch(removeItem({ medicine_id: item.medicine_id, unit: item.unit }))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                  style={{ color: '#8a8a94' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#d95555'; e.currentTarget.style.background = 'rgba(217,85,85,0.10)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#8a8a94'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CartTable;
