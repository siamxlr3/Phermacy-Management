import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../language/GlobalTranslate.jsx';
import { useLookupSaleQuery, useProcessReturnMutation } from '../../store/api/returnsApi';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, AlertCircle, ShoppingBag, ArrowLeftRight, CreditCard, CheckCircle2, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const ReturnForm = ({ onComplete }) => {
    const { translations } = useLanguage();
    const t = translations?.returns?.form;
    const [invoiceSearch, setInvoiceSearch] = useState('');
    const [debouncedInvoice, setDebouncedInvoice] = useState('');
    const [returnItems, setReturnItems] = useState([]);
    const [reason, setReason] = useState('');
    const [refundMethod, setRefundMethod] = useState('cash');

    const { data: saleData, isLoading: isSearching, isError } = useLookupSaleQuery(debouncedInvoice, {
        skip: !debouncedInvoice
    });

    const [processReturn, { isLoading: isProcessing }] = useProcessReturnMutation();

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedInvoice(invoiceSearch), 500);
        return () => clearTimeout(handler);
    }, [invoiceSearch]);

    useEffect(() => {
        if (saleData?.data) {
            const items = saleData.data.items.map(item => {
                const tabletsPerSaleUnit = item.qty_tablets / item.sale_qty;
                const alreadyReturnedTablets = item.return_items_sum_qty_returned || 0;
                const alreadyReturnedInSaleUnits = alreadyReturnedTablets / tabletsPerSaleUnit;
                const maxInSaleUnits = item.sale_qty - alreadyReturnedInSaleUnits;

                return {
                    ...item,
                    tabletsPerSaleUnit,
                    alreadyReturnedInSaleUnits,
                    qty_to_return: maxInSaleUnits,
                    max_returnable: maxInSaleUnits,
                    return_condition: 'resellable'
                };
            });
            setReturnItems(items);
        }
    }, [saleData]);

    const handleQtyChange = (itemId, qty) => {
        setReturnItems(prev => prev.map(item => {
            if (item.id === itemId) {
                const val = Math.min(Math.max(0, qty), item.max_returnable);
                return { ...item, qty_to_return: val };
            }
            return item;
        }));
    };

    const toggleAll = (select) => {
        setReturnItems(prev => prev.map(item => ({
            ...item,
            qty_to_return: select ? item.max_returnable : 0
        })));
    };

    const handleConditionChange = (itemId, condition) => {
        setReturnItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, return_condition: condition } : item
        ));
    };

    const calculateReturnTotals = () => {
        return returnItems.reduce((acc, item) => {
            const tabletsToReturn = item.qty_to_return * item.tabletsPerSaleUnit;
            const subtotal = tabletsToReturn * item.unit_price;
            return {
                subtotal: acc.subtotal + subtotal,
                tax: 0,
                total: acc.total + subtotal
            };
        }, { subtotal: 0, tax: 0, total: 0 });
    };

    const handleSubmit = async () => {
        const itemsToReturn = returnItems.filter(item => item.qty_to_return > 0);
        if (itemsToReturn.length === 0) {
            toast.error(t?.error_select_item || 'Please select at least one item to return');
            return;
        }

        const totals = calculateReturnTotals();
        const isFullReturn = returnItems.every(item => item.qty_to_return === item.max_returnable);
        const returnType = isFullReturn ? 'full' : 'partial';

        const payload = {
            sale_id: saleData.data.id,
            reason,
            subtotal_returned: totals.subtotal,
            tax_returned: 0,
            total_returned: totals.total,
            refund_method: refundMethod,
            original_payment_method: saleData.data.payment_method?.toLowerCase() || 'cash',
            return_type: returnType,
            items: itemsToReturn.map(item => ({
                sale_item_id: item.id,
                qty_returned: item.qty_to_return * item.tabletsPerSaleUnit, // Send as total tablets
                return_condition: item.return_condition || 'resellable',
            }))
        };

        try {
            await processReturn(payload).unwrap();
            toast.success(t?.success_msg || 'Return processed successfully');
            setInvoiceSearch('');
            setReturnItems([]);
            onComplete && onComplete();
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to process return');
        }
    };

    const totals = calculateReturnTotals();
    const allSelected = returnItems.length > 0 && returnItems.every(i => i.qty_to_return === i.max_returnable);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex gap-8 h-full min-h-0">
                {/* Left Side: Invoice Lookup & Items Selection */}
                <div className="flex-[3] flex flex-col min-h-0 gap-6">
                    {/* Invoice Search Box */}
                    <div className="p-8 bg-white rounded-[32px] border border-slate-200 shadow-sm shadow-slate-200/50">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                <Search size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">{t?.lookup_title || 'Lookup Sale Invoice'}</h3>
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">{t?.lookup_subtitle || 'Identify transaction for refund'}</p>
                            </div>
                        </div>
                        <div className="mt-6 flex flex-col gap-4">
                            <input
                                type="text"
                                placeholder={t?.invoice_placeholder || "Enter Invoice Number (e.g., INV-000001)"}
                                value={invoiceSearch}
                                onChange={(e) => setInvoiceSearch(e.target.value)}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all placeholder:text-slate-400"
                            />
                            
                            <AnimatePresence mode="wait">
                                {isSearching ? (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 text-slate-400 ml-2">
                                        <Loader2 className="animate-spin" size={16} />
                                        <span className="text-xs font-bold uppercase tracking-widest">{t?.searching || 'Searching system...'}</span>
                                    </motion.div>
                                ) : isError ? (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 text-rose-500 ml-2">
                                        <AlertCircle size={16} />
                                        <span className="text-xs font-bold uppercase tracking-widest">{t?.not_found || 'Invoice not found'}</span>
                                    </motion.div>
                                ) : saleData?.data && (
                                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                                                <ShoppingBag size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-0.5">{t?.found_sale || 'Found Sale'}</p>
                                                <p className="text-sm font-black text-slate-800">{saleData.data.invoice_number} — {format(new Date(saleData.data.sale_date), 'MMM dd, yyyy')}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-0.5">{t?.status || 'Status'}</p>
                                            <span className="text-xs font-black text-emerald-600 bg-emerald-100/50 px-3 py-1 rounded-full">{saleData.data.status}</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Items Table Section */}
                    <div className="flex-1 min-h-0 bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm shadow-slate-200/50 flex flex-col">
                        <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[3px]">{t?.billable_items || 'Billable Items for Return'}</span>
                            {returnItems.length > 0 && (
                                <button 
                                    onClick={() => toggleAll(!allSelected)}
                                    className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                                >
                                    {allSelected ? 'Deselect All' : 'Select All'}
                                </button>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                            {returnItems.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center grayscale opacity-20">
                                    <ShoppingBag size={48} className="mb-4" />
                                    <p className="text-sm font-black uppercase tracking-widest">{t?.no_transaction || 'No transaction Loaded'}</p>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="sticky top-0 bg-white border-b border-slate-100 z-10">
                                        <tr>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">{t?.headers?.medicine || 'Medicine'}</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t?.headers?.unit_type || 'Unit Type'}</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t?.headers?.sold_units || 'Sold Units'}</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t?.headers?.returned || 'Returned'}</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t?.headers?.return_qty || 'Return Qty'}</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t?.headers?.condition || 'Condition'}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {returnItems.map(item => (
                                            <tr key={item.id} className={`transition-colors ${item.qty_to_return > 0 ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}`}>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <input 
                                                            type="checkbox"
                                                            checked={item.qty_to_return > 0}
                                                            onChange={(e) => handleQtyChange(item.id, e.target.checked ? item.max_returnable : 0)}
                                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800">{item.medicine_name}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.batch_number}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="text-[10px] font-black text-blue-600 bg-blue-100/50 px-2.5 py-1 rounded-full uppercase">
                                                        {item.sale_qty - (item.alreadyReturnedInSaleUnits || 0)} {item.sale_unit === 'Tablet' ? (item.dosage_form || 'Pc') : item.sale_unit}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="text-sm font-black text-slate-900">{item.sale_qty - (item.alreadyReturnedInSaleUnits || 0)}</span>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="text-sm font-black text-rose-500">{item.alreadyReturnedInSaleUnits || 0}</span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
                                                            <input 
                                                                type="number" 
                                                                value={item.qty_to_return}
                                                                onChange={(e) => handleQtyChange(item.id, parseFloat(e.target.value) || 0)}
                                                                className="w-14 bg-transparent border-0 px-1 py-0.5 text-center font-black text-xs outline-none"
                                                            />
                                                            <span className="text-[9px] font-black text-slate-400 uppercase pr-1">/ {item.max_returnable}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <select
                                                        value={item.return_condition}
                                                        onChange={(e) => handleConditionChange(item.id, e.target.value)}
                                                        className="text-[10px] font-black uppercase bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                                                    >
                                                        <option value="resellable">✅ {t?.conditions?.resellable || 'Resellable'}</option>
                                                        <option value="damaged">⚠️ {t?.conditions?.damaged || 'Damaged'}</option>
                                                        <option value="expired">❌ {t?.conditions?.expired || 'Expired'}</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: Return Summary & Submission */}
                <div className="flex-1 flex flex-col gap-6 h-fit sticky top-0">
                    <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl shadow-slate-900/40 border border-slate-800 flex flex-col gap-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-rose-500/20 border border-rose-500/30 rounded-2xl flex items-center justify-center text-rose-400">
                                <RotateCcw size={22} />
                            </div>
                            <h3 className="text-xl font-black tracking-tight uppercase tracking-widest text-[14px]">{t?.summary_title || 'Refund Summary'}</h3>
                        </div>

                        {/* Refund Totals */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t?.base_return || 'Base Return'}</span>
                                <span className="text-base font-black text-slate-200">৳{totals.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="h-px bg-slate-800 my-2" />
                            <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[2px] mb-2">{t?.total_refund || 'Total Amount to Refund'}</p>
                                <div className="text-4xl font-black text-white tracking-tighter italic">
                                    ৳{totals.total.toFixed(2)}
                                </div>
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div className="space-y-6 pt-2">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t?.refund_method || 'Refund Method'}</label>
                                <div className="relative">
                                    <select
                                        value={refundMethod}
                                        onChange={(e) => setRefundMethod(e.target.value)}
                                        className="w-full bg-slate-800/40 border border-slate-700 rounded-2xl p-4 text-sm font-bold text-slate-200 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 appearance-none"
                                    >
                                        <option value="cash">{t?.methods?.cash || 'Cash'}</option>
                                        <option value="card">{t?.methods?.card || 'Card'}</option>
                                        <option value="online">{t?.methods?.online || 'Online'}</option>
                                        <option value="store_credit">{t?.methods?.store_credit || 'Store Credit'}</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                        <CreditCard size={16} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t?.reason_label || 'Return Reason'}</label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder={t?.reason_placeholder || "Enter reason for return..."}
                                    className="w-full bg-slate-800/40 border border-slate-700 rounded-2xl p-4 text-sm font-bold text-slate-200 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all min-h-[100px]"
                                />
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={isProcessing || totals.total === 0}
                                className="w-full group relative overflow-hidden bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 py-5 px-6 rounded-2xl transition-all shadow-xl shadow-rose-900/20 flex items-center justify-center gap-3 active:scale-[0.98]"
                            >
                                <AnimatePresence mode="wait">
                                    {isProcessing ? (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
                                            <Loader2 className="animate-spin" size={20} />
                                            <span className="font-black text-sm uppercase tracking-widest">{t?.processing || 'Processing Refund...'}</span>
                                        </motion.div>
                                    ) : (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
                                            <CheckCircle2 size={20} />
                                            <span className="font-black text-sm uppercase tracking-widest">{t?.submit || 'Submit Reversal'}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReturnForm;
