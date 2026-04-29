import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  cart: [],
  customer: { id: 'walk-in', name: 'Walk-in Customer' },
  subtotal: 0,
  tax_rate: 0,
  tax_name: 'Tax',
  tax_total: 0,
  discount_total: 0,
  grand_total: 0,
  status: 'idle',
  payment_method: 'Cash',
  heldSells: [],
};

const posSlice = createSlice({
  name: 'pos',
  initialState,
  reducers: {
    addItem: (state, action) => {
      const { medicine, selectedUnit = 'Tablet' } = action.payload;
      const existingItem = state.cart.find((i) => i.medicine_id === medicine.id && i.unit === selectedUnit);
      
      if (existingItem) {
        existingItem.quantity += 1;
        existingItem.qty_tablets = calculateTotalTablets(existingItem.quantity, existingItem.unit, medicine);
      } else {
        const qty_tablets = calculateTotalTablets(1, selectedUnit, medicine);
        state.cart.push({ 
          medicine_id: medicine.id,
          name: medicine.name,
          manufacturer: medicine.manufacturer,
          unit: selectedUnit,
          quantity: 1,
          qty_tablets: qty_tablets,
          unit_price: medicine.price_per_tablet, // Cost per tablet
          price_per_unit: calculateUnitPrice(selectedUnit, medicine),
          tax_rate: medicine.tax_rate || 0,
          tablets_per_strip: medicine.tablets_per_strip,
          strips_per_box: medicine.strips_per_box
        });
      }
      posSlice.caseReducers.calculateTotals(state);
    },
    removeItem: (state, action) => {
      const { medicine_id, unit } = action.payload;
      state.cart = state.cart.filter((i) => !(i.medicine_id === medicine_id && i.unit === unit));
      posSlice.caseReducers.calculateTotals(state);
    },
    updateQuantity: (state, action) => {
      const { medicine_id, unit, quantity } = action.payload;
      const item = state.cart.find((i) => i.medicine_id === medicine_id && i.unit === unit);
      if (item && quantity > 0) {
        item.quantity = quantity;
        item.qty_tablets = calculateTotalTablets(quantity, unit, item);
      }
      posSlice.caseReducers.calculateTotals(state);
    },
    calculateTotals: (state) => {
      state.subtotal = state.cart.reduce((acc, item) => acc + (item.price_per_unit * item.quantity), 0);
      state.tax_total = state.subtotal * (state.tax_rate / 100);
      state.grand_total = state.subtotal + state.tax_total - state.discount_total;
    },
    setTaxConfig: (state, action) => {
      const { rate, name } = action.payload;
      state.tax_rate = parseFloat(rate) || 0;
      state.tax_name = name || 'Tax';
      posSlice.caseReducers.calculateTotals(state);
    },
    setPaymentMethod: (state, action) => {
      state.payment_method = action.payload;
    },
    setDiscount: (state, action) => {
      state.discount_total = action.payload;
      posSlice.caseReducers.calculateTotals(state);
    },
    clearCart: (state) => {
      const heldSells = state.heldSells;
      Object.assign(state, initialState);
      state.heldSells = heldSells;
    },
    holdCurrentCart: (state) => {
      if (state.cart.length === 0) return;
      
      const heldSell = {
        id: Date.now(),
        label: `Order #${String(state.heldSells.length + 1).padStart(3, '0')}`,
        items: [...state.cart],
        subtotal: state.subtotal,
        tax_total: state.tax_total,
        tax_rate: state.tax_rate,
        tax_name: state.tax_name,
        discount_total: state.discount_total,
        grand_total: state.grand_total,
        payment_method: state.payment_method,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      
      state.heldSells.push(heldSell);
      // Clear current cart but keep heldSells
      const heldSellsBackup = state.heldSells;
      Object.assign(state, initialState);
      state.heldSells = heldSellsBackup;
    },
    resumeHeldSell: (state, action) => {
      const index = action.payload;
      const heldSell = state.heldSells[index];
      if (heldSell) {
        state.cart = heldSell.items;
        state.subtotal = heldSell.subtotal;
        state.tax_total = heldSell.tax_total;
        state.tax_rate = heldSell.tax_rate;
        state.tax_name = heldSell.tax_name;
        state.discount_total = heldSell.discount_total;
        state.grand_total = heldSell.grand_total;
        state.payment_method = heldSell.payment_method;
        state.heldSells.splice(index, 1);
      }
    },
    removeHeldSell: (state, action) => {
      state.heldSells.splice(action.payload, 1);
    }
  },
});

// Helper functions for internal logic
const calculateTotalTablets = (qty, unit, medicine) => {
  if (unit === 'Box') return qty * medicine.strips_per_box * medicine.tablets_per_strip;
  if (unit === 'Strip') return qty * medicine.tablets_per_strip;
  return qty;
};

const calculateUnitPrice = (unit, medicine) => {
  const basePrice = parseFloat(medicine.price_per_tablet);
  if (unit === 'Box') return basePrice * medicine.strips_per_box * medicine.tablets_per_strip;
  if (unit === 'Strip') return basePrice * medicine.tablets_per_strip;
  return basePrice;
};

export const { 
  addItem, removeItem, updateQuantity, setDiscount, clearCart, 
  setCustomer, setTaxConfig, setPaymentMethod,
  holdCurrentCart, resumeHeldSell, removeHeldSell
} = posSlice.actions;
export default posSlice.reducer;
