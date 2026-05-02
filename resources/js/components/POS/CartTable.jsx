import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeItem, updateQuantity, updateItemUnit, updateItemPrice } from '../../store/slices/posSlice';
import { Trash2, Plus, Minus, Package, Tablet, Layers, ShoppingCart, Info } from 'lucide-react';
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
      <div className="shrink-0 grid grid-cols-[1fr_120px_140px_100px_40px] gap-4 px-5 py-3 sticky top-0 z-10"
        style={{ background: '#f0f0f3', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <span className="text-[10px] font-bold uppercase tracking-widest text-left" style={{ color: '#8a8a94' }}>Medicine & Unit</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-center" style={{ color: '#8a8a94' }}>Qty</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-center" style={{ color: '#8a8a94' }}>Unit Price</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-center" style={{ color: '#8a8a94' }}>Total</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-right" style={{ color: '#8a8a94' }}></span>
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
              >
                {/* Medicine info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#1a1a1f' }}>{item.name}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {['Tablet', 'Capsule', 'Suppository', 'Patch'].includes(item.dosage_form) ? (
                        <select
                            value={item.unit}
                            onChange={(e) => dispatch(updateItemUnit({ medicine_id: item.medicine_id, oldUnit: item.unit, newUnit: e.target.value }))}
                            className="text-[10px] font-bold px-2 py-1 rounded-md outline-none transition-all cursor-pointer"
                            style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
                        >
                            <option value="Tablet">Tablet</option>
                            <option value="Strip">Strip</option>
                            <option value="Box">Box</option>
                        </select>
                    ) : (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-md"
                              style={{ background: 'rgba(58,170,114,0.10)', border: '1px solid rgba(58,170,114,0.25)', color: '#3aaa72' }}>
                            {item.dosage_form || 'Unit'}
                        </span>
                    )}
                    {(item.unit === 'Box' || item.unit === 'Strip') && (
                        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                           <Info size={10} />
                           {item.unit === 'Box' ? `${item.strips_per_box}s x ${item.tablets_per_strip}t` : `${item.tablets_per_strip} tablets`}
                        </div>
                    )}
                  </div>
                </div>

                {/* Qty stepper */}
                <div className="w-[120px] flex items-center justify-center">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
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
                        <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => dispatch(updateQuantity({ medicine_id: item.medicine_id, unit: item.unit, quantity: parseInt(e.target.value) || 0 }))}
                            className="text-xs font-bold w-10 text-center bg-transparent border-none outline-none"
                            style={{ color: '#1a1a1f' }}
                        />
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
                </div>

                {/* Unit Price Adjustment */}
                <div className="w-[140px] flex justify-center">
                    <div className="relative group">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 group-focus-within:text-emerald-500">$</span>
                        <input
                            type="number"
                            step="0.01"
                            value={item.price_per_unit}
                            onChange={(e) => dispatch(updateItemPrice({ medicine_id: item.medicine_id, unit: item.unit, price: e.target.value }))}
                            className="pl-5 pr-2 py-1.5 w-24 rounded-lg text-xs font-bold outline-none bg-white/50 border border-slate-200 focus:border-emerald-500/50 transition-all text-center"
                            style={{ color: '#1a1a1f' }}
                        />
                    </div>
                </div>

                {/* Line total */}
                <div className="w-[100px] text-center">
                    <span className="text-sm font-black text-slate-900">${lineTotal}</span>
                </div>

                {/* Remove */}
                <div className="w-[40px] flex justify-end">
                    <button
                        onClick={() => dispatch(removeItem({ medicine_id: item.medicine_id, unit: item.unit }))}
                        className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
                        style={{ color: '#8a8a94' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#d95555'; e.currentTarget.style.background = 'rgba(217,85,85,0.10)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#8a8a94'; e.currentTarget.style.background = 'transparent'; }}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CartTable;
