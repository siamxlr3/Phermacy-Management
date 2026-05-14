import { createSlice } from '@reduxjs/toolkit';

const loadState = () => {
  try {
    const serializedState = localStorage.getItem('pos_state');
    if (serializedState === null) return undefined;
    return JSON.parse(serializedState);
  } catch (err) {
    return undefined;
  }
};

const persistedState = loadState();

const initialState = persistedState || {
  cart: [],
  customer_name: 'Walk-in Customer',
  customer_phone: '',
  subtotal: 0,
  tax_rate: 0,
  tax_name: 'Tax',
  tax_total: 0,
  discount_total: 0,
  grand_total: 0,
  status: 'idle',
  payment_method: 'Cash',
  heldSells: [],
  activeRegister: null,
};

const posSlice = createSlice({
  name: 'pos',
  initialState,
  reducers: {
    setRegister: (state, action) => {
      state.activeRegister = action.payload;
    },
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
          name: medicine.medicine_name,
          manufacturer: medicine.manufacturer,
          dosage_form: medicine.dosage_form,
          unit: selectedUnit,
          quantity: 1,
          qty_tablets: qty_tablets,
          price_per_tablet: medicine.price_per_unit,
          price_per_stripe: medicine.price_per_stripe,
          price_per_box: medicine.price_per_box,
          general_price: medicine.price_per_unit, // For non-solid forms
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
    updateItemUnit: (state, action) => {
      const { medicine_id, oldUnit, newUnit } = action.payload;
      const item = state.cart.find((i) => i.medicine_id === medicine_id && i.unit === oldUnit);
      if (item) {
        item.unit = newUnit;
        item.price_per_unit = calculateUnitPrice(newUnit, item);
        item.qty_tablets = calculateTotalTablets(item.quantity, newUnit, item);
      }
      posSlice.caseReducers.calculateTotals(state);
    },
    updateItemPrice: (state, action) => {
      const { medicine_id, unit, price } = action.payload;
      const item = state.cart.find((i) => i.medicine_id === medicine_id && i.unit === unit);
      if (item) {
        item.price_per_unit = parseFloat(price) || 0;
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
    setCustomerInfo: (state, action) => {
      const { name, phone } = action.payload;
      state.customer_name = name;
      state.customer_phone = phone;
    },
    setDiscount: (state, action) => {
      state.discount_total = action.payload;
      posSlice.caseReducers.calculateTotals(state);
    },
    clearCart: (state) => {
      const heldSells = state.heldSells;
      const activeRegister = state.activeRegister;
      const tax_rate = state.tax_rate;
      const tax_name = state.tax_name;
      state.cart = [];
      state.customer_name = 'Walk-in Customer';
      state.customer_phone = '';
      state.subtotal = 0;
      state.tax_total = 0;
      state.discount_total = 0;
      state.grand_total = 0;
      state.status = 'idle';
      state.payment_method = 'Cash';
      state.heldSells = heldSells;
      state.activeRegister = activeRegister;
      state.tax_rate = tax_rate;
      state.tax_name = tax_name;
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
        customer_name: state.customer_name,
        customer_phone: state.customer_phone,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      
      state.heldSells.push(heldSell);
      // Clear current cart but keep heldSells, activeRegister, and tax config
      const heldSellsBackup = state.heldSells;
      const activeRegisterBackup = state.activeRegister;
      const taxRate = state.tax_rate;
      const taxName = state.tax_name;
      state.cart = [];
      state.customer_name = 'Walk-in Customer';
      state.customer_phone = '';
      state.subtotal = 0;
      state.tax_total = 0;
      state.discount_total = 0;
      state.grand_total = 0;
      state.status = 'idle';
      state.payment_method = 'Cash';
      state.heldSells = heldSellsBackup;
      state.activeRegister = activeRegisterBackup;
      state.tax_rate = taxRate;
      state.tax_name = taxName;
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
        state.customer_name = heldSell.customer_name || 'Walk-in Customer';
        state.customer_phone = heldSell.customer_phone || '';
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
  const tabletsPerStrip = medicine.tablets_per_strip || 1;
  const stripsPerBox = medicine.strips_per_box || 1;
  
  if (unit === 'Box') return qty * stripsPerBox * tabletsPerStrip;
  if (unit === 'Strip') return qty * tabletsPerStrip;
  return qty;
};

const calculateUnitPrice = (unit, medicine) => {
  if (unit === 'Box' && medicine.price_per_box) return parseFloat(medicine.price_per_box);
  if (unit === 'Strip' && medicine.price_per_stripe) return parseFloat(medicine.price_per_stripe);
  if (unit === 'Tablet' && medicine.price_per_unit) return parseFloat(medicine.price_per_unit);
  
  // Fallback to unit price if it exists
  return parseFloat(medicine.price_per_unit || 0);
};

export const { 
  setRegister, addItem, removeItem, updateQuantity, updateItemUnit, updateItemPrice,
  setDiscount, clearCart, setCustomerInfo, setTaxConfig, setPaymentMethod,
  holdCurrentCart, resumeHeldSell, removeHeldSell
} = posSlice.actions;
export default posSlice.reducer;
