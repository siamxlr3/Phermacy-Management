import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Loader2, AlertCircle, X, Play, Pill, Boxes, Droplets, AlertTriangle, ChevronRight } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { addItem, clearCart, setTaxConfig, resumeHeldSell, removeHeldSell, setRegister } from '../store/slices/posSlice';
import { useGetMedicinesQuery } from '../store/api/medicineApi';
import { useGetTaxesQuery } from '../store/api/settingApi';
import { useGetSalesQuery, useProcessSaleMutation } from '../store/api/salesApi';
import { useGetRegisterStatusQuery } from '../store/api/cashRegisterApi';
import CartTable from '../components/POS/CartTable';
import BillingSummary from '../components/POS/BillingSummary';
import InvoiceModal from '../components/POS/InvoiceModal';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../language/GlobalTranslate.jsx';
import { printPOSReceipt } from '../utils/printer';

/* ── Design tokens from sample ── */
const T = {
  bg: '#f7f8fa', surface: '#fff', s2: '#f0f2f6', s3: '#e6e9f0',
  border: '#dde1ea', border2: '#c8cdd9',
  text: '#0e1117', text2: '#4a5068', text3: '#8890a8',
  teal: '#00897b', tealL: '#e0f2f0', tealD: '#00695c',
  blue: '#2563eb', blueL: '#eff4ff',
  amber: '#d97706', amberL: '#fef3c7',
  red: '#dc2626', redL: '#fef2f2',
  green: '#16a34a', greenL: '#f0fdf4',
  purple: '#7c3aed', purpleL: '#f5f3ff',
};

const GROUP_A = ['Tablet', 'Capsule', 'Suppository', 'Patch'];

const NewPOSPage = () => {
  const { translations } = useLanguage();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [selectedUnits, setSelectedUnits] = useState({});
  const [clock, setClock] = useState('');

  const cartState = useSelector((state) => state.pos);
  const { heldSells, cart } = cartState;
  const { data: medicinesData, isLoading: loadingMedicines, isFetching: fetchingMedicines } = useGetMedicinesQuery({ search: debouncedSearch, perPage: 50 });
  const isSearchLoading = loadingMedicines || fetchingMedicines;
  const { data: taxesData } = useGetTaxesQuery({ perPage: 100 });
  const [processSale, { isLoading: isProcessing }] = useProcessSaleMutation();
  const { data: salesData } = useGetSalesQuery({ perPage: 1 });
  const { data: registerStatus } = useGetRegisterStatusQuery();


  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    if (taxesData?.data) {
      const activeTax = taxesData.data.find(t => t.status === 'Active');
      if (activeTax) dispatch(setTaxConfig({ rate: activeTax.rate, name: activeTax.name }));
    }
  }, [taxesData, dispatch]);

  // Clock
  useEffect(() => {
    const update = () => setClock(new Date().toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' }));
    update();
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, []);

  // F2 shortcut
  useEffect(() => {
    const handler = (e) => { if (e.key === 'F2') { e.preventDefault(); searchRef.current?.focus(); } };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleProcessSale = async () => {
    if (cart.length === 0) return;
    try {
      const saleData = {
        customer_name: cartState.customer_name,
        customer_phone: cartState.customer_phone,
        subtotal: cartState.subtotal,
        tax_total: cartState.tax_total,
        discount_total: cartState.discount_total,
        grand_total: cartState.grand_total,
        payment_method: cartState.payment_method,
        items: cart.map(item => {
          const tabletsPerUnit = item.qty_tablets / item.quantity;
          const pricePerTablet = item.price_per_unit / tabletsPerUnit;
          return {
            medicine_id: item.medicine_id,
            sale_unit: item.unit,
            quantity: item.quantity,
            qty_tablets: item.qty_tablets,
            unit_price: pricePerTablet,
            tax_amount: (item.price_per_unit * item.quantity) * (cartState.tax_rate / 100),
            subtotal: item.price_per_unit * item.quantity
          };
        })
      };
      const result = await processSale(saleData).unwrap();
      setLastSale(result.data);
      
      // Automate POS Print
      printPOSReceipt(result.data, translations);

      dispatch(clearCart());
      toast.success('Sale processed successfully. Printing receipt...');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to process sale');
    }
  };

  const handleResume = (index) => {
    if (cart.length > 0) {
      if (!window.confirm('Current cart has items. Replacing with held sell?')) return;
    }
    dispatch(resumeHeldSell(index));
    setIsResumeModalOpen(false);
    toast.success('Sell resumed successfully');
  };

  const handleAddToCart = (med, unit) => {
    dispatch(addItem({ medicine: med, selectedUnit: unit }));
  };

  const getSelectedUnit = (medId) => selectedUnits[medId] || 'Tablet';
  const setMedUnit = (medId, unit) => setSelectedUnits(prev => ({ ...prev, [medId]: unit }));

  const getUnitPrice = (med, unit) => {
    if (unit === 'Box' && med.price_per_box) return parseFloat(med.price_per_box);
    if (unit === 'Strip' && med.price_per_stripe) return parseFloat(med.price_per_stripe);
    if (unit === 'Tablet' && med.price_per_tablet) return parseFloat(med.price_per_tablet);
    return parseFloat(med.price || med.price_per_tablet || 0);
  };

  const getCartQtyForMed = (medId) => cart.filter(c => c.medicine_id === medId).reduce((a, c) => a + c.quantity, 0);

  const medicines = medicinesData?.data || [];
  const summary = registerStatus?.summary || { today_in: 0, today_out: 0 };
  const dueSummary = salesData?.summary || { total_due: 0, total_due_customers: 0 };

  const iconBgs = ['#e8f4fd', '#fef9e7', '#f3e8ff', '#fff7e6', '#e8f5e9', '#e3f2fd', '#fce4ec', '#e0f7fa'];

  return (
    <DashboardLayout noScroll>
      <Toaster position="top-right" toastOptions={{
        style: { background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13 }
      }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .pos-shell * { font-family: 'IBM Plex Sans', sans-serif; }
        .pos-mono { font-family: 'IBM Plex Mono', monospace !important; }
        .pos-grid::-webkit-scrollbar { width: 4px; }
        .pos-grid::-webkit-scrollbar-thumb { background: ${T.border2}; border-radius: 4px; }
        .pos-grid::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      <div className="pos-shell flex flex-col h-full min-h-0 -m-6 overflow-hidden" style={{ background: T.bg }}>

        {/* ══════ TOPBAR ══════ */}
        <div className="shrink-0 flex items-center gap-2.5 px-3.5 h-12"
          style={{ background: T.surface, borderBottom: `1px solid ${T.border}` }}>
          <div className="flex-1 relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: T.text3 }}>⌕</span>
            <input
              ref={searchRef}
              type="text"
              placeholder={translations.pos.search_placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-1.5 pl-8 pr-12 rounded-lg text-[13px] outline-none transition-colors"
              style={{ background: T.bg, border: `1px solid ${searchTerm ? T.teal : T.border}`, color: T.text }}
            />
            <span className="pos-mono absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-px rounded"
              style={{ background: T.s2, border: `1px solid ${T.border}`, color: T.text3 }}>F2</span>
          </div>
          <span className="pos-mono text-xs whitespace-nowrap" style={{ color: T.text2 }}>{clock}</span>
        </div>

        {/* ══════ MAIN GRID ══════ */}
        <div className="flex-1 flex min-h-0 overflow-hidden">

          {/* ── LEFT PANEL ── */}
          <div className="flex-1 flex flex-col overflow-hidden" style={{ borderRight: `1px solid ${T.border}` }}>

            {/* Stats Strip */}
            <div className="shrink-0 grid grid-cols-2 gap-1.5 p-2.5">
              <div className="rounded-lg p-2" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: T.text3, letterSpacing: '0.4px' }}>{translations.pos.today_sales}</div>
                <div className="pos-mono text-[15px] font-semibold" style={{ color: T.teal }}>৳{summary.today_in}</div>
                <div className="text-[10px] mt-px" style={{ color: T.text3 }}>{translations.pos.cash_inflow}</div>
              </div>
              <div 
                onClick={() => navigate('/sales-history', { state: { showDueOnly: true } })}
                className="rounded-lg p-2 cursor-pointer transition-all hover:bg-rose-50/30 group" 
                style={{ background: T.surface, border: `1px solid ${T.border}` }}
              >
                <div className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: T.text3 }}>{translations.pos.due_pending}</div>
                <div className="pos-mono text-[15px] font-semibold flex items-center justify-between" style={{ color: T.red }}>
                  <span>৳{Number(dueSummary.total_due || 0).toLocaleString()}</span>
                  <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-[10px] mt-px flex items-center justify-between" style={{ color: T.text3 }}>
                  <span>{dueSummary.total_due_customers || 0} {translations.pos.customers}</span>
                  <span className="text-[9px] font-medium opacity-0 group-hover:opacity-100">{translations.pos.view_details}</span>
                </div>
              </div>
            </div>


            {/* Medicine Grid */}
            <div className="pos-grid flex-1 overflow-y-auto grid grid-cols-4 gap-1.5 p-3 pt-0 content-start">
              {isSearchLoading ? (
                <div className="col-span-4 flex flex-col items-center justify-center py-16 gap-3" style={{ color: T.text3 }}>
                  <Loader2 className="animate-spin" size={28} />
                  <span className="text-xs font-medium">{translations.pos.searching}</span>
                </div>
              ) : medicines.length === 0 ? (
                <div className="col-span-4 flex flex-col items-center justify-center py-16 gap-3" style={{ color: T.text3 }}>
                  <AlertCircle size={28} />
                  <span className="text-xs font-medium">{translations.pos.no_medicines}</span>
                </div>
              ) : (
                medicines.map((med, idx) => {
                  const isGA = GROUP_A.includes(med.dosage_form);
                  const selUnit = getSelectedUnit(med.id);
                  const price = getUnitPrice(med, isGA ? selUnit : 'Tablet');
                  const cartQty = getCartQtyForMed(med.id);
                  const isLow = (med.stock || 0) <= (med.reorder_level || 10);
                  const bgColor = iconBgs[idx % iconBgs.length];

                  return (
                    <div key={med.id}
                      className="relative flex flex-col rounded-xl p-2.5 transition-colors"
                      style={{
                        background: T.surface,
                        border: `1.5px solid ${cartQty > 0 ? T.teal : T.border}`,
                      }}>
                      
                      <div className="flex flex-col min-w-0">
                        {/* Cart quantity bubble */}
                        {cartQty > 0 && (
                          <div className="pos-mono absolute top-1.5 right-1.5 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-semibold text-white"
                            style={{ background: T.teal }}>{cartQty}</div>
                        )}

                        {/* Icon */}
                        <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center mb-1.5 text-base shrink-0"
                          style={{ background: bgColor }}>
                          {isGA ? <Pill size={15} style={{ color: T.teal }} /> : <Droplets size={15} style={{ color: T.blue }} />}
                        </div>

                        {/* Name & generic */}
                        <div className="text-[11.5px] font-medium leading-tight mb-px truncate" style={{ color: T.text }} title={med.name}>{med.name}</div>
                        <div className="flex flex-col gap-0.5 mb-1.5">
                          <div className="text-[9.5px] font-medium italic leading-tight truncate" style={{ color: T.text3 }} title={med.generic_name}>{med.generic_name || '—'}</div>
                          <div className="text-[9px] font-bold uppercase tracking-tight truncate" style={{ color: T.tealD }} title={med.manufacturer_name}>{med.manufacturer_name || '—'}</div>
                        </div>

                        {/* Badges */}
                        {isLow && (
                          <span className="pos-mono inline-block text-[9px] px-1.5 py-px rounded mb-1.5 self-start shrink-0"
                            style={{ background: T.amberL, color: T.amber, border: '1px solid #fcd34d' }}>LOW</span>
                        )}

                        {/* Unit Selector (Group A only) */}
                        {isGA && (
                          <div className="grid grid-cols-3 gap-0.5 mb-1.5 shrink-0" style={{ marginTop: isLow ? '0' : '4px' }}>
                            {[
                              { u: 'Tablet', label: translations.pos.piece, sub: `1 ${translations.pos.unit_tablet}`, cls: 'piece' },
                              { u: 'Strip', label: translations.pos.strip, sub: `${med.tablet_per_stripe || '—'} ${translations.pos.tabs}`, cls: 'strip' },
                              { u: 'Box', label: translations.pos.box, sub: `${med.stripe_per_box || '—'} ${translations.pos.unit_strip}s`, cls: 'box' },
                            ].map(({ u, label, sub, cls }) => {
                              const isOn = selUnit === u;
                              const colors = cls === 'piece'
                                ? { bg: T.tealL, border: T.teal, color: T.tealD }
                                : cls === 'strip'
                                ? { bg: T.blueL, border: T.blue, color: T.blue }
                                : { bg: T.purpleL, border: T.purple, color: T.purple };
                              return (
                                <button key={u}
                                  onClick={() => setMedUnit(med.id, u)}
                                  className="py-1 px-0.5 rounded text-[10px] font-medium text-center transition-all leading-tight cursor-pointer"
                                  style={{
                                    background: isOn ? colors.bg : T.bg,
                                    border: `1px solid ${isOn ? colors.border : T.border}`,
                                    color: isOn ? colors.color : T.text2,
                                  }}>
                                  {label}
                                  <span className="block text-[9px] font-normal opacity-80 truncate">{sub}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Footer: price + stock + add */}
                      <div className="flex items-center justify-between mt-auto pt-2 shrink-0">
                        <div className="min-w-0 pr-1">
                          <span className="pos-mono text-[13px] font-semibold block truncate" style={{ color: T.teal }}>৳{(price || 0).toFixed(2)}</span>
                          <span className="block text-[9.5px] truncate" style={{ color: T.text3 }}>{med.stock || 0} {translations.pos.piece}s</span>
                        </div>
                        <button
                          onClick={() => handleAddToCart(med, isGA ? selUnit : 'Tablet')}
                          className="py-1 px-2.5 rounded text-[11px] font-medium text-white transition-colors cursor-pointer shrink-0"
                          style={{ background: T.teal }}
                          onMouseEnter={e => e.currentTarget.style.background = T.tealD}
                          onMouseLeave={e => e.currentTarget.style.background = T.teal}>
                          {translations.pos.add}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="shrink-0 flex flex-col overflow-hidden" style={{ width: 320, background: T.surface }}>
            <BillingSummary onProcess={handleProcessSale} isProcessing={isProcessing} onOpenResume={() => setIsResumeModalOpen(true)} />
          </div>
        </div>
      </div>

      {/* ══════ HELD SELLS MODAL ══════ */}
      <AnimatePresence>
        {isResumeModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsResumeModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="relative w-full max-w-md max-h-[500px] overflow-hidden rounded-2xl shadow-2xl flex flex-col"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${T.border}` }}>
                <span className="text-[13px] font-semibold" style={{ color: T.text }}>⏸ {translations.pos.held_orders}</span>
                <button onClick={() => setIsResumeModalOpen(false)} style={{ color: T.text3 }}>
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {heldSells.length === 0 ? (
                  <div className="text-center py-10" style={{ color: T.text3 }}>
                    <p className="text-xs font-medium">{translations.pos.no_held_orders}</p>
                    <p className="text-[10px] mt-1">{translations.pos.hold_to_see}</p>
                  </div>
                ) : (
                  heldSells.map((h, idx) => (
                    <div key={h.id} onClick={() => handleResume(idx)}
                      className="p-3 mb-2 rounded-lg cursor-pointer transition-all"
                      style={{ background: T.bg, border: `1px solid ${T.border}` }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = T.teal}
                      onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[11.5px] font-semibold" style={{ color: T.text }}>{h.label}</span>
                        <span className="text-[10px]" style={{ color: T.text3 }}>🕐 {h.time}</span>
                      </div>
                      <div className="text-[10px] mb-2" style={{ color: T.text3 }}>
                        {h.items.map(i => `${i.name} x${i.quantity}`).join(' · ')}
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="pos-mono text-sm font-semibold" style={{ color: T.teal }}>৳{h.grand_total.toFixed(2)}</span>
                        <div className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded"
                          style={{ background: T.tealL, border: `1px solid ${T.teal}`, color: T.tealD }}>
                          <Play size={10} /> {translations.pos.resume}
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

      {/* Invoice Modal */}
      {isInvoiceOpen && (
        <InvoiceModal sale={lastSale} onClose={() => setIsInvoiceOpen(false)} />
      )}
    </DashboardLayout>
  );
};

export default NewPOSPage;
