import { configureStore } from '@reduxjs/toolkit';
import globalReducer from './slices/globalSlice';
import supplierReducer from './slices/supplierSlice';
import salesReducer from './slices/salesSlice';
import posReducer from './slices/posSlice';

import { settingApi } from './api/settingApi';
import { medicineApi } from './api/medicineApi';
import { supplierApi } from './api/supplierApi';
import { purchaseApi } from './api/purchaseApi';
import { grnApi } from './api/grnApi';
import { stockApi } from './api/stockApi';

import { salesApi } from './api/salesApi';
import { returnsApi } from './api/returnsApi';
import { alertsApi } from './api/alertsApi';
import { reportsApi } from './api/reportsApi';
import { inventoryReportsApi } from './api/inventoryReportsApi';
import { expenseApi } from './api/expenseApi';
import { cashRegisterApi } from './api/cashRegisterApi';
import { stockAdjustmentsApi } from './api/stockAdjustmentsApi';

const saveStateMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  if (action.type.startsWith('pos/')) {
    const state = store.getState().pos;
    // On clearCart, only persist what's needed — not cart items
    if (action.type === 'pos/clearCart') {
      localStorage.setItem('pos_state', JSON.stringify({
        heldSells: state.heldSells,
        activeRegister: state.activeRegister,
        tax_rate: state.tax_rate,
        tax_name: state.tax_name,
        payment_method: state.payment_method,
        cart: [],
        customer_name: 'Walk-in Customer',
        customer_phone: '',
        subtotal: 0,
        tax_total: 0,
        discount_total: 0,
        grand_total: 0,
        status: 'idle',
      }));
    } else {
      localStorage.setItem('pos_state', JSON.stringify(state));
    }
  }
  return result;
};

export const store = configureStore({
  reducer: {
    global: globalReducer,
    sales: salesReducer,
    pos: posReducer,

    [settingApi.reducerPath]: settingApi.reducer,
    [medicineApi.reducerPath]: medicineApi.reducer,
    [supplierApi.reducerPath]: supplierApi.reducer,
    [purchaseApi.reducerPath]: purchaseApi.reducer,
    [grnApi.reducerPath]: grnApi.reducer,
    [stockApi.reducerPath]: stockApi.reducer,

    [salesApi.reducerPath]: salesApi.reducer,
    [returnsApi.reducerPath]: returnsApi.reducer,
    [alertsApi.reducerPath]: alertsApi.reducer,
    [reportsApi.reducerPath]: reportsApi.reducer,
    [inventoryReportsApi.reducerPath]: inventoryReportsApi.reducer,
    [expenseApi.reducerPath]: expenseApi.reducer,
    [cashRegisterApi.reducerPath]: cashRegisterApi.reducer,
    [stockAdjustmentsApi.reducerPath]: stockAdjustmentsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
      .concat(saveStateMiddleware)
      .concat(settingApi.middleware)
      .concat(medicineApi.middleware)
      .concat(supplierApi.middleware)
      .concat(purchaseApi.middleware)
      .concat(grnApi.middleware)
      .concat(stockApi.middleware)

      .concat(salesApi.middleware)
      .concat(returnsApi.middleware)
      .concat(alertsApi.middleware)
      .concat(reportsApi.middleware)
      .concat(inventoryReportsApi.middleware)
      .concat(expenseApi.middleware)
      .concat(cashRegisterApi.middleware)
      .concat(stockAdjustmentsApi.middleware),
});
