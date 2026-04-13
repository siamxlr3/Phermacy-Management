import './bootstrap';
import '../css/app.css';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { store } from './store/store';
import Dashboard from './pages/Dashboard';
import MedicinePage from './pages/MedicinePage';
import SalesHistoryPage from './pages/SalesHistoryPage';
import SuppliersPage from './pages/SuppliersPage';
import OrdersPage from './pages/OrdersPage';

import SettingPage from './pages/SettingPage';
import GRNPage from './pages/GRNPage';
import CurrentStockPage from './pages/CurrentStockPage';
import SuppliersReturnPage from './pages/SuppliersReturnPage';
import NewPOSPage from './pages/NewPOSPage';
import ReturnsPage from './pages/ReturnsPage';
import CriticalAlertsPage from './pages/CriticalAlertsPage';
import SalesReportsPage from './pages/SalesReportsPage';
import InventoryReportsPage from './pages/InventoryReportsPage';
import ExpensePage from './pages/ExpensePage';
import HRMPage from './pages/HRMPage';

const App = () => {
    return (
        <Provider store={store}>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    
                    {/* Sales */}
                    <Route path="/pos" element={<NewPOSPage />} />
                    <Route path="/pos/new" element={<NewPOSPage />} />
                    <Route path="/sales" element={<SalesHistoryPage />} />
                    <Route path="/sales/returns" element={<ReturnsPage />} />
                    <Route path="/sales/reports" element={<SalesReportsPage />} />

                    {/* Inventory */}
                    <Route path="/medicines" element={<MedicinePage />} />
                    <Route path="/stock" element={<CurrentStockPage />} />
                    <Route path="/inventory/medicines" element={<MedicinePage />} />
                    <Route path="/inventory/stock" element={<CurrentStockPage />} />
                    <Route path="/inventory/adjustments" element={<Dashboard />} />
                    <Route path="/inventory/alerts" element={<CriticalAlertsPage />} />
                    <Route path="/inventory/reports" element={<InventoryReportsPage />} />
                    <Route path="/inventory/interactions" element={<Dashboard />} />

                    {/* Purchasing */}
                    <Route path="/suppliers" element={<SuppliersPage />} />
                    <Route path="/orders" element={<OrdersPage />} />
                    <Route path="/grn" element={<GRNPage />} />
                    <Route path="/returns" element={<SuppliersReturnPage />} />
                    <Route path="/purchasing/suppliers" element={<SuppliersPage />} />
                    <Route path="/purchasing/orders" element={<OrdersPage />} />
                    <Route path="/purchasing/grn" element={<GRNPage />} />
                    <Route path="/purchasing/returns" element={<SuppliersReturnPage />} />

                    {/* HRM */}
                    <Route path="/hrm" element={<HRMPage />} />

                    {/* Expenses */}
                    <Route path="/expenses" element={<ExpensePage />} />

                    {/* Reports */}
                    <Route path="/reports/sales" element={<Dashboard />} />
                    <Route path="/reports/inventory" element={<Dashboard />} />
                    <Route path="/reports/purchase" element={<Dashboard />} />


                    {/* System */}
                    <Route path="/alerts" element={<CriticalAlertsPage />} />
                    <Route path="/settings/users" element={<Dashboard />} />
                    <Route path="/settings/audit" element={<Dashboard />} />
                    <Route path="/settings" element={<SettingPage />} />
                </Routes>
            </BrowserRouter>
        </Provider>
    );
};

const container = document.getElementById('app');
if (!container._reactRoot) {
    container._reactRoot = createRoot(container);
}
container._reactRoot.render(<App />);
