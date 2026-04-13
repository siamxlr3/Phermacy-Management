import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeItem, updateQuantity } from '../../store/slices/posSlice';
import { Trash2, Plus, Minus, Package, Tablet, Layers } from 'lucide-react';

const CartTable = () => {
  const { cart } = useSelector((state) => state.pos);
  const dispatch = useDispatch();

  const getUnitIcon = (unit) => {
    switch (unit) {
      case 'Box': return <Package size={14} />;
      case 'Strip': return <Layers size={14} />;
      default: return <Tablet size={14} />;
    }
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
          <Package size={32} />
        </div>
        <div className="text-center">
          <p className="font-bold text-slate-500">Cart is empty</p>
          <p className="text-xs">Search and add medicines to start billing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Medicine & Unit</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Quantity</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Price</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Total</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cart.map((item) => (
              <tr key={`${item.medicine_id}-${item.unit}`} className="hover:bg-slate-50/50 transition-all">
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-slate-700 leading-none">{item.name}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1">{item.manufacturer}</span>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full w-fit uppercase">
                      {getUnitIcon(item.unit)}
                      {item.unit} ({item.unit === 'Box' ? `${item.strips_per_box} strips` : item.unit === 'Strip' ? `${item.tablets_per_strip} tablets` : 'Individual'})
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => dispatch(updateQuantity({ medicine_id: item.medicine_id, unit: item.unit, quantity: item.quantity - 1 }))}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-400 transition-all"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-black text-slate-800 w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => dispatch(updateQuantity({ medicine_id: item.medicine_id, unit: item.unit, quantity: item.quantity + 1 }))}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-400 transition-all"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm font-medium text-slate-500">${item.price_per_unit.toFixed(2)}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm font-black text-slate-900">${(item.price_per_unit * item.quantity).toFixed(2)}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => dispatch(removeItem({ medicine_id: item.medicine_id, unit: item.unit }))}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CartTable;
