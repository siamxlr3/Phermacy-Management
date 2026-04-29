import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, Plus, Package, Tablet, Layers, Loader2, AlertCircle, Pill, Sparkles, X, Play } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { addItem, clearCart, setTaxConfig, resumeHeldSell, removeHeldSell } from '../store/slices/posSlice';
import { useGetMedicinesQuery } from '../store/api/medicineApi';
import { useGetTaxesQuery } from '../store/api/settingApi';
import { useProcessSaleMutation } from '../store/api/salesApi';
import CartTable from '../components/POS/CartTable';
import BillingSummary from '../components/POS/BillingSummary';
import InvoiceModal from '../components/POS/InvoiceModal';
import toast, { Toaster } from 'react-hot-toast';

const NewPOSPage = () => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [lastSale, setLastSale] = useState(null);

  const cartState = useSelector((state) => state.pos);
  const { heldSells } = cartState;
  const { data: medicinesData, isLoading: loadingMedicines, isFetching: fetchingMedicines } = useGetMedicinesQuery({ search: debouncedSearch });
  const isSearchLoading = loadingMedicines || fetchingMedicines || (searchTerm !== debouncedSearch);
  const { data: taxesData } = useGetTaxesQuery({ perPage: 100 });
  const [processSale, { isLoading: isProcessing }] = useProcessSaleMutation();

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    if (taxesData?.data) {
      const activeTax = taxesData.data.find(t => t.status === 'Active');
      if (activeTax) {
        dispatch(setTaxConfig({ rate: activeTax.rate, name: activeTax.name }));
      }
    }
  }, [taxesData, dispatch]);

  const handleProcessSale = async () => {
    if (cartState.cart.length === 0) return;
    try {
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
          unit_price: item.unit_price,
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

  const handleResume = (index) => {
    if (cartState.cart.length > 0) {
      if (!window.confirm('Current cart has items. Replacing with held sell?')) return;
    }
    dispatch(resumeHeldSell(index));
    setIsResumeModalOpen(false);
    toast.success('Sell resumed successfully');
  };

  const medicines = medicinesData?.data || [];
  const cartCount = cartState.cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <DashboardLayout noScroll>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#162035', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontFamily: 'Outfit, sans-serif' }
      }} />

      <div className="flex flex-col h-full min-h-0 -m-6 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #e8e8eb 0%, #dddde0 100%)', backgroundImage: "radial-gradient(ellipse 80% 50% at 20% -10%, rgba(201,151,42,0.06) 0%, transparent 60%)" }}
      >
        {/* ── Search Bar ── */}
        <div className="shrink-0 px-7 pt-5 pb-4">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 transition-colors text-gray-400 group-focus-within:text-amber-500" size={17} />
            <input
              type="text"
              placeholder="Search medicine by name or generic name…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-20 py-3.5 rounded-xl text-sm font-medium outline-none transition-all"
              style={{
                background: '#f8f8fa',
                border: searchTerm ? '1px solid rgba(201,151,42,0.45)' : '1px solid rgba(0,0,0,0.11)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)',
                color: '#1a1a1f'
              }}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-semibold px-2 py-0.5 rounded"
              style={{ background: '#d2d2d6', border: '1px solid rgba(0,0,0,0.11)', color: '#8a8a94' }}>
              ⌘ K
            </span>

            {/* Search Dropdown */}
            <AnimatePresence>
              {searchTerm && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50"
                  style={{ background: '#f8f8fa', border: '1px solid rgba(0,0,0,0.11)', boxShadow: '0 8px 32px rgba(0,0,0,0.13), 0 4px 12px rgba(0,0,0,0.07)' }}
                >
                  <div className="p-2 max-h-[380px] overflow-y-auto">
                    {isSearchLoading ? (
                      <div className="p-10 text-center flex flex-col items-center gap-3" style={{ color: '#8a8a94' }}>
                        <Loader2 className="animate-spin" size={28} />
                        <span className="text-xs font-semibold">Searching pharmacy inventory…</span>
                      </div>
                    ) : medicines.length === 0 ? (
                      <div className="p-10 text-center flex flex-col items-center gap-3" style={{ color: '#8a8a94' }}>
                        <AlertCircle size={28} />
                        <span className="text-xs font-semibold">No medicines found for "{searchTerm}"</span>
                      </div>
                    ) : (
                      medicines.map((m) => (
                        <div key={m.id}
                          className="p-4 rounded-xl mb-1 last:mb-0 transition-all"
                          style={{ border: '1px solid transparent' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,151,42,0.35)'; e.currentTarget.style.background = '#f0f0f3'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent'; }}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: '#e8e8eb', border: '1px solid rgba(0,0,0,0.07)' }}>
                                <Pill size={18} style={{ color: '#c9972a' }} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold truncate" style={{ color: '#1a1a1f' }}>{m.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#8a8a94' }}>{m.generic_name}</span>
                                  {m.manufacturer && <><span className="w-1 h-1 rounded-full" style={{ background: '#c9c9cc' }} /><span className="text-[10px] font-semibold" style={{ color: '#4a90d9' }}>{m.manufacturer}</span></>}
                                </div>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: 'rgba(74,144,217,0.12)', color: '#4a90d9', border: '1px solid rgba(74,144,217,0.25)' }}>Stock: {m.stock} tabs</span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: 'rgba(201,151,42,0.12)', color: '#c9972a', border: '1px solid rgba(201,151,42,0.30)' }}>${m.price_per_tablet}/tab</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5 shrink-0">
                              <button
                                onClick={() => { dispatch(addItem({ medicine: m, selectedUnit: 'Tablet' })); setSearchTerm(''); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                                style={{ background: '#e8e8eb', border: '1px solid rgba(0,0,0,0.09)', color: '#4a4a52' }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#dddde0'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#e8e8eb'; }}
                              >
                                <Tablet size={12} /> Tablet
                              </button>
                              {m.tablets_per_strip > 0 && (
                                <button
                                  onClick={() => { dispatch(addItem({ medicine: m, selectedUnit: 'Strip' })); setSearchTerm(''); }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                                  style={{ background: 'rgba(74,144,217,0.12)', border: '1px solid rgba(74,144,217,0.25)', color: '#4a90d9' }}
                                >
                                  <Layers size={12} /> Strip ({m.tablets_per_strip}t)
                                </button>
                              )}
                              {m.strips_per_box > 0 && (
                                <button
                                  onClick={() => { dispatch(addItem({ medicine: m, selectedUnit: 'Box' })); setSearchTerm(''); }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                                  style={{ background: '#0f1b2d', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                                >
                                  <Package size={12} /> Box ({m.strips_per_box}s)
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

        {/* ── Workspace ── */}
        <div className="flex-1 flex gap-5 min-h-0 px-7 pb-6">

          {/* Cart Panel */}
          <div className="flex-1 flex flex-col min-h-0 rounded-2xl overflow-hidden relative"
            style={{
              background: '#f8f8fa',
              border: '1px solid rgba(0,0,0,0.11)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)'
            }}>
            {/* Gold top shimmer */}
            <div className="absolute top-0 left-0 right-0 h-[3px]"
              style={{ background: 'linear-gradient(90deg,transparent,rgba(201,151,42,0.35),transparent)' }} />

            {/* Cart Header */}
            <div className="shrink-0 flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                  style={{ background: 'linear-gradient(135deg,#1e2d47,#0f1b2d)', boxShadow: '0 2px 8px rgba(15,27,45,0.25)' }}>
                  <ShoppingBag size={16} />
                </div>
                <div>
                  <p className="text-[15px] font-semibold" style={{ color: '#1a1a1f', fontFamily: "'Playfair Display', serif" }}>Active POS Cart</p>
                  <p className="text-[11px]" style={{ color: '#8a8a94' }}>
                    {cartCount > 0 ? `${cartCount} item${cartCount !== 1 ? 's' : ''} in cart` : 'No items yet'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => dispatch(clearCart())}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all"
                style={{ color: '#d95555', background: 'rgba(217,85,85,0.10)', border: '1px solid rgba(217,85,85,0.2)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(217,85,85,0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(217,85,85,0.10)'}
              >
                ✕ Clear cart
              </button>
            </div>

            {/* Cart Body */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <CartTable />
            </div>
          </div>

          {/* Billing Panel */}
          <div className="flex-shrink-0 w-[340px] flex flex-col">
            <BillingSummary onProcess={handleProcessSale} isProcessing={isProcessing} onOpenResume={() => setIsResumeModalOpen(true)} />
          </div>
        </div>
      </div>

      {/* Held Sells Modal */}
      <AnimatePresence>
        {isResumeModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsResumeModalOpen(false)}
              className="absolute inset-0 bg-[#0a0f19]/65 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              className="relative w-full max-w-md max-h-[500px] overflow-hidden rounded-2xl shadow-2xl flex flex-col"
              style={{ background: 'linear-gradient(160deg, #162035, #0f1b2d)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center justify-between p-5 border-b border-[rgba(255,255,255,0.08)]">
                <span className="text-lg font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>⏸ Held Sells</span>
                <button onClick={() => setIsResumeModalOpen(false)} className="text-white/40 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {heldSells.length === 0 ? (
                  <div className="text-center py-10" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    <p className="text-sm">No held sells yet.</p>
                    <p className="text-xs mt-1">Hold a sell to see it here.</p>
                  </div>
                ) : (
                  heldSells.map((h, idx) => (
                    <div
                      key={h.id}
                      onClick={() => handleResume(idx)}
                      className="group p-4 mb-3 rounded-xl cursor-pointer transition-all border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(58,170,114,0.30)]"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-white tracking-tight">{h.label}</span>
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>🕐 {h.time}</span>
                      </div>
                      <div className="text-[11px] leading-relaxed mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        {h.items.map(i => `${i.name} x${i.quantity}`).join(' · ')}
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-base font-bold" style={{ color: '#e8b84b' }}>${h.grand_total.toFixed(2)}</span>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold"
                          style={{ background: 'rgba(58,170,114,0.12)', border: '1px solid rgba(58,170,114,0.30)', color: '#3aaa72' }}>
                          <Play size={10} /> Tap to Resume
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Modal / Invoice */}
      {isInvoiceOpen && (
        <InvoiceModal sale={lastSale} onClose={() => setIsInvoiceOpen(false)} />
      )}
    </DashboardLayout>
  );
};

export default NewPOSPage;
