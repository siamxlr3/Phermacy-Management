import { configureStore } from '@reduxjs/toolkit';
import globalReducer from './slices/globalSlice';
import supplierReducer from './slices/supplierSlice';
import salesReducer from './slices/salesSlice';
import posReducer from './slices/posSlice';
import productReducer from '../features/productSlice';
import { settingApi } from './api/settingApi';
import { medicineApi } from './api/medicineApi';
import { supplierApi } from './api/supplierApi';
import { purchaseApi } from './api/purchaseApi';
import { grnApi } from './api/grnApi';
import { stockApi } from './api/stockApi';
import { adjustmentApi } from './api/adjustmentApi';
import { salesApi } from './api/salesApi';
import { returnsApi } from './api/returnsApi';
import { alertsApi } from './api/alertsApi';
import { reportsApi } from './api/reportsApi';
import { inventoryReportsApi } from './api/inventoryReportsApi';
import { expenseApi } from './api/expenseApi';
import { hrmApi } from './api/hrmApi';

export const store = configureStore({
  reducer: {
    global: globalReducer,
    sales: salesReducer,
    pos: posReducer,
    products: productReducer,
    [settingApi.reducerPath]: settingApi.reducer,
    [medicineApi.reducerPath]: medicineApi.reducer,
    [supplierApi.reducerPath]: supplierApi.reducer,
    [purchaseApi.reducerPath]: purchaseApi.reducer,
    [grnApi.reducerPath]: grnApi.reducer,
    [stockApi.reducerPath]: stockApi.reducer,
    [adjustmentApi.reducerPath]: adjustmentApi.reducer,
    [salesApi.reducerPath]: salesApi.reducer,
    [returnsApi.reducerPath]: returnsApi.reducer,
    [alertsApi.reducerPath]: alertsApi.reducer,
    [reportsApi.reducerPath]: reportsApi.reducer,
    [inventoryReportsApi.reducerPath]: inventoryReportsApi.reducer,
    [expenseApi.reducerPath]: expenseApi.reducer,
    [hrmApi.reducerPath]: hrmApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(settingApi.middleware)
      .concat(medicineApi.middleware)
      .concat(supplierApi.middleware)
      .concat(purchaseApi.middleware)
      .concat(grnApi.middleware)
      .concat(stockApi.middleware)
      .concat(adjustmentApi.middleware)
      .concat(salesApi.middleware)
      .concat(returnsApi.middleware)
      .concat(alertsApi.middleware)
      .concat(reportsApi.middleware)
      .concat(inventoryReportsApi.middleware)
      .concat(expenseApi.middleware)
      .concat(hrmApi.middleware),
});
