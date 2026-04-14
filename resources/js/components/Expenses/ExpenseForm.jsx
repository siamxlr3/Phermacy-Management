import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Plus, Trash2, Receipt, User, Phone, MapPin, Calendar, CreditCard, ChevronDown, Package, Activity, Info, CheckCircle2, Loader2 } from 'lucide-react';
import { useAddExpenseMutation, useUpdateExpenseMutation } from '../../store/api/expenseApi';
import { toast } from 'react-hot-toast';

const initialForm = {
    supplier_name: '',
    contact_person: '',
    phone: '',
    address: '',
    expense_date: new Date().toISOString().split('T')[0],
    status: 'Unpaid',
    items: [
        { items_name: '', category: 'Piece', qty: 1, price: 0, total_price: 0 }
    ]
};

const ExpenseForm = ({ onClose, expense }) => {
    const [formData, setFormData] = useState(initialForm);
    const [addExpense, { isLoading: isAdding }] = useAddExpenseMutation();
    const [updateExpense, { isLoading: isUpdating }] = useUpdateExpenseMutation();

    useEffect(() => {
        if (expense) {
            setFormData({
                supplier_name: expense.supplier_name || '',
                contact_person: expense.contact_person || '',
                phone: expense.phone || '',
                address: expense.address || '',
                expense_date: expense.expense_date || new Date().toISOString().split('T')[0],
                status: expense.status || 'Unpaid',
                items: expense.items && expense.items.length > 0
                    ? expense.items.map(i => ({...i}))
                    : [{ items_name: '', category: 'Piece', qty: 1, price: 0, total_price: 0 }]
            });
        } else {
            // Reset to a completely clean state when opening for a new entry
            setFormData({
                supplier_name: '',
                contact_person: '',
                phone: '',
                address: '',
                expense_date: new Date().toISOString().split('T')[0],
                status: 'Unpaid',
                items: [{ items_name: '', category: 'Piece', qty: 1, price: 0, total_price: 0 }]
            });
        }
    }, [expense]);

    const calculateGrandTotal = (items) => {
        return items.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        
        if (field === 'qty' || field === 'price') {
            const qty = Number(newItems[index].qty) || 0;
            const price = Number(newItems[index].price) || 0;
            newItems[index].total_price = qty * price;
        }

        setFormData({ ...formData, items: newItems });
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { items_name: '', category: 'Piece', qty: 1, price: 0, total_price: 0 }]
        });
    };

    const removeItem = (index) => {
        if (formData.items.length === 1) return;
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.items.some(i => !i.items_name || !i.price || !i.qty)) {
            toast.error('Please fill in all required item fields');
            return;
        }

        const payload = {
            ...formData,
            grand_total: calculateGrandTotal(formData.items)
        };

        try {
            if (expense) {
                await updateExpense({ id: expense.id, ...payload }).unwrap();
                toast.success('Expense record updated');
            } else {
                await addExpense(payload).unwrap();
                toast.success('New expense recorded');
            }
            onClose();
        } catch (error) {
            toast.error(error.data?.message || 'Submission failed');
        }
    };

    const isLoading = isAdding || isUpdating;

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="shrink-0 px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                        <Receipt size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">{expense ? 'Edit Expense' : 'Record Expenditure'}</h3>
                        <p className="text-xs text-slate-400 font-medium">
                            {expense ? `Voucher: ${expense.transaction_id}` : 'Fill in the supplier and item details below'}
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                    <X size={20} className="text-slate-400" />
                </button>
            </div>

            <form id="expense-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {/* Step 1: General Info */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                        <Info size={16} className="text-indigo-500" />
                        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Supplier & Vendor Profile</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Supplier Name</label>
                            <div className="relative">
                                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    value={formData.supplier_name}
                                    onChange={(e) => setFormData({...formData, supplier_name: e.target.value})}
                                    className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all"
                                    placeholder="Company or individual name"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Transaction Date</label>
                            <input
                                type="date"
                                required
                                value={formData.expense_date}
                                onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                                className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Contact Person</label>
                            <div className="relative">
                                <Activity size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={formData.contact_person}
                                    onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                                    className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all"
                                    placeholder="Name of contact person"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
                            <div className="relative">
                                <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all"
                                    placeholder="e.g. +880 1..."
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Payment Status</label>
                            <div className="relative group">
                                <CreditCard size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                                    className="w-full pl-10 pr-10 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="Paid">Mark as Paid</option>
                                    <option value="Unpaid">Mark as Unpaid</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:rotate-180 transition-transform" />
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Company Address</label>
                            <div className="relative">
                                <MapPin size={14} className="absolute left-3.5 top-4 text-slate-400" />
                                <textarea
                                    rows="2"
                                    value={formData.address}
                                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                                    className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all resize-none"
                                    placeholder="Full address of the supplier..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Step 2: Line Items */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                            <Package size={16} className="text-indigo-500" />
                            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Detail Line Items</h4>
                        </div>
                        <button 
                            type="button"
                            onClick={addItem}
                            className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all group"
                        >
                            <Plus size={12} className="group-hover:rotate-90 transition-transform" /> Add Row
                        </button>
                    </div>

                    <div className="space-y-4">
                        {formData.items.map((item, idx) => (
                            <div key={idx} className="bg-slate-50/40 p-4 rounded-2xl border border-slate-100 space-y-4 group/row hover:border-indigo-100 transition-all">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Item Row #{idx + 1}</span>
                                    {formData.items.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeItem(idx)}
                                            className="p-1 text-slate-300 hover:text-rose-500 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-12 gap-4">
                                    <div className="col-span-12 md:col-span-12 lg:col-span-4 space-y-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Item Description</span>
                                        <input
                                            type="text"
                                            required
                                            value={item.items_name}
                                            onChange={(e) => handleItemChange(idx, 'items_name', e.target.value)}
                                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                                            placeholder="e.g. Office Stationery"
                                        />
                                    </div>
                                    <div className="col-span-6 md:col-span-4 lg:col-span-2 space-y-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Type</span>
                                        <div className="relative">
                                            <select
                                                value={item.category}
                                                onChange={(e) => handleItemChange(idx, 'category', e.target.value)}
                                                className="w-full pl-3 pr-8 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                                            >
                                                <option value="Piece">Piece</option>
                                                <option value="Packet">Packet</option>
                                                <option value="Box">Box</option>
                                            </select>
                                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="col-span-6 md:col-span-4 lg:col-span-2 space-y-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Quantity</span>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={item.qty}
                                            onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div className="col-span-6 md:col-span-4 lg:col-span-2 space-y-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Price</span>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            step="0.01"
                                            value={item.price}
                                            onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div className="col-span-6 md:col-span-4 lg:col-span-2 space-y-1 text-right">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Subtotal</span>
                                        <div className="px-3 py-2 text-sm bg-slate-100 border border-slate-100 rounded-lg text-right font-black text-slate-600">
                                            ৳{parseFloat(item.total_price || 0).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </form>

            {/* Action Footer */}
            <div className="shrink-0 p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">Total Payable Amount</span>
                    <span className="text-2xl font-black text-slate-900 leading-none mt-1">
                        ৳{calculateGrandTotal(formData.items).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-700 transition-all">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="expense-form"
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 active:scale-95"
                    >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                        {expense ? 'Update Record' : 'Record Expenditure'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExpenseForm;
