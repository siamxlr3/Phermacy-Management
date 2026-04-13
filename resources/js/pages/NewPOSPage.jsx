import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, Plus, Package, Tablet, Layers, Loader2, AlertCircle } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { addItem, clearCart, setTaxConfig } from '../store/slices/posSlice';
import { useGetMedicinesQuery } from '../store/api/medicineApi';
import { useGetTaxesQuery } from '../store/api/settingApi';
import { useProcessSaleMutation } from '../store/api/salesApi';
import CartTable from '../components/POS/CartTable';
import BillingSummary from '../components/POS/BillingSummary';
import InvoiceModal from '../components/POS/InvoiceModal';
import { useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';

const NewPOSPage = () => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [lastSale, setLastSale] = useState(null);

  const cartState = useSelector((state) => state.pos);
  const { data: medicinesData, isLoading: loadingMedicines, isFetching: fetchingMedicines } = useGetMedicinesQuery({ search: debouncedSearch });
  // Show loading if we are fetching OR if the user has typed something that hasn't been debounced yet
  const isSearchLoading = loadingMedicines || fetchingMedicines || (searchTerm !== debouncedSearch);
  const { data: taxesData } = useGetTaxesQuery({ perPage: 100 });
  const [processSale, { isLoading: isProcessing }] = useProcessSaleMutation();

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Handle setting the global tax from settings
  useEffect(() => {
    if (taxesData?.data) {
      const activeTax = taxesData.data.find(t => t.status === 'Active');
      if (activeTax) {
        dispatch(setTaxConfig({ 
          rate: activeTax.rate, 
          name: activeTax.name 
        }));
      }
    }
  }, [taxesData, dispatch]);

  const handleProcessSale = async () => {
    if (cartState.cart.length === 0) return;
    try {
      // Map cart state to the format expected by StoreSaleRequest
      const saleData = {
        subtotal: cartState.subtotal,
        tax_total: cartState.tax_total,
        discount_total: cartState.discount_total,
        grand_total: cartState.grand_total,
        payment_method: cartState.payment_method,
        items: cartState.cart.map(item => ({
          medicine_id: item.medicine_id,
          sale_unit: item.unit,
          qty_tablets: item.qty_tablets,
          unit_price: item.unit_price, // price per tablet
          tax_amount: (item.unit_price * item.qty_tablets) * (cartState.tax_rate / 100),
          subtotal: item.price_per_unit * item.quantity
        }))
      };

      const result = await processSale(saleData).unwrap();
      setLastSale(result.data);
      setIsInvoiceOpen(true);
      dispatch(clearCart());
      toast.success('Sale processed successfully');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to process sale');
    }
  };

  const medicines = medicinesData?.data || [];

  return (
    <DashboardLayout noScroll>
      <Toaster position="top-right" />
      
      <div className="flex flex-col h-full min-h-0 bg-slate-50/50 -m-6 p-6 overflow-hidden">
        {/* Top Search Bar */}
        <div className="shrink-0 flex items-center gap-6 mb-6">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search medicine by name or generic name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-700 font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
            />
            
            {/* Search Results Dropdown */}
            <AnimatePresence>
              {searchTerm && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-3xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="p-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {isSearchLoading ? (
                      <div className="p-12 text-center text-slate-400 font-bold flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin" size={32} />
                        Searching pharmacy inventory...
                      </div>
                    ) : medicines.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 font-bold flex flex-col items-center gap-4">
                        <AlertCircle size={32} />
                        No medicines found matching "{searchTerm}"
                      </div>
                    ) : (
                      medicines.map((m) => (
                        <div key={m.id} className="p-6 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-all rounded-2xl">
                          <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-base font-black text-slate-900 mb-0.5">{m.name}</h4>
                                <div className="flex items-center gap-2 mb-1.5">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{m.generic_name}</p>
                                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none">{m.manufacturer}</p>
                                </div>
                                <div className="flex items-center gap-3 mt-3">
                                    <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-500 rounded-lg">Stock: {m.stock} tabs</span>
                                    <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-500 rounded-lg">${m.price_per_tablet}/tablet</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => { dispatch(addItem({ medicine: m, selectedUnit: 'Tablet' })); setSearchTerm(''); }}
                                    className="flex items-center gap-2 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl uppercase transition-all"
                                >
                                    <Tablet size={14} /> Add Tablets
                                </button>
                                {m.tablets_per_strip > 0 && (
                                    <button
                                        onClick={() => { dispatch(addItem({ medicine: m, selectedUnit: 'Strip' })); setSearchTerm(''); }}
                                        className="flex items-center gap-2 px-6 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-black rounded-xl uppercase transition-all"
                                    >
                                        <Layers size={14} /> Add Strip ({m.tablets_per_strip} tabs)
                                    </button>
                                )}
                                {m.strips_per_box > 0 && (
                                    <button
                                        onClick={() => { dispatch(addItem({ medicine: m, selectedUnit: 'Box' })); setSearchTerm(''); }}
                                        className="flex items-center gap-2 px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl uppercase transition-all"
                                    >
                                        <Package size={14} /> Add Box ({m.strips_per_box} strips)
                                    </button>
                                )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Workspace Layout */}
        <div className="flex-1 flex gap-8 min-h-0">
          {/* Main Cart Section */}
          <div className="flex-[3] flex flex-col min-h-0 bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
            <div className="shrink-0 p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/10">
                  <ShoppingBag size={20} />
                </div>
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">Active POS Cart</h2>
              </div>
              <button 
                onClick={() => dispatch(clearCart())}
                className="text-xs font-black text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-4 py-2 rounded-xl transition-all uppercase tracking-widest"
              >
                Clear Cart
              </button>
            </div>
            
            <div className="flex-1 min-h-0 p-4">
              <CartTable />
            </div>
          </div>

          {/* Billing Sidebar Section */}
          <div className="flex-1 flex flex-col min-h-0">
            <BillingSummary onProcess={handleProcessSale} isProcessing={isProcessing} />
          </div>
        </div>
      </div>

      {/* Success Modal / Invoice */}
      {isInvoiceOpen && (
        <InvoiceModal sale={lastSale} onClose={() => setIsInvoiceOpen(false)} />
      )}
    </DashboardLayout>
  );
};

export default NewPOSPage;
