import React, { useState, useEffect, useRef } from 'react';
import { Package, Hash, Layers, FileText, Save, X, PlusCircle, AlertCircle, Info, ChevronRight, RefreshCw, Search, CheckCircle2 } from 'lucide-react';
import { useGetActiveMedicinesQuery } from '../../store/api/medicineApi';
import { useLazyGetMedicineBatchesQuery } from '../../store/api/stockApi';
import { motion } from 'framer-motion';
import { useLanguage } from '../../language/GlobalTranslate';

const StockAdjustmentForm = ({ onSubmit, onCancel, isSubmitting }) => {
    const { language, translations } = useLanguage();
    const t = translations.stock_adjustments;

    // Maps dosage_form → { primary unit value, available unit options }
    const DOSAGE_UNIT_MAP = {
        Tablet:       { primary: 'piece',   units: [{ value: 'piece',   label: t.units.piece }, { value: 'strip', label: t.units.strip }, { value: 'box', label: t.units.box }] },
        Capsule:      { primary: 'piece',   units: [{ value: 'piece',   label: t.units.piece }, { value: 'strip', label: t.units.strip }, { value: 'box', label: t.units.box }] },
        Suppository:  { primary: 'piece',   units: [{ value: 'piece',   label: t.units.piece }, { value: 'strip', label: t.units.strip }, { value: 'box', label: t.units.box }] },
        Patch:        { primary: 'piece',   units: [{ value: 'piece',   label: t.units.piece }, { value: 'box', label: t.units.box }] },
        Sachet:       { primary: 'piece',   units: [{ value: 'piece',   label: t.units.piece }, { value: 'box', label: t.units.box }, { value: 'pack', label: t.units.pack }] },
        Syrup:        { primary: 'bottle',  units: [{ value: 'bottle',  label: t.units.bottle }, { value: 'pack', label: t.units.pack }] },
        Suspension:   { primary: 'bottle',  units: [{ value: 'bottle',  label: t.units.bottle }, { value: 'pack', label: t.units.pack }] },
        Drops:        { primary: 'bottle',  units: [{ value: 'bottle',  label: t.units.bottle }, { value: 'vial', label: t.units.vial }] },
        Injection:    { primary: 'vial',    units: [{ value: 'vial',    label: t.units.vial }, { value: 'box', label: t.units.box }] },
        Inhaler:      { primary: 'inhaler', units: [{ value: 'inhaler', label: t.units.inhaler }, { value: 'pack', label: t.units.pack }] },
        Cream:        { primary: 'tube',    units: [{ value: 'tube',    label: t.units.tube }, { value: 'box', label: t.units.box }] },
        Ointment:     { primary: 'tube',    units: [{ value: 'tube',    label: t.units.tube }, { value: 'box', label: t.units.box }] },
        Gel:          { primary: 'tube',    units: [{ value: 'tube',    label: t.units.tube }, { value: 'bottle', label: t.units.bottle }] },
        Lotion:       { primary: 'bottle',  units: [{ value: 'bottle',  label: t.units.bottle }, { value: 'tube', label: t.units.tube }] },
        Powder:       { primary: 'pack',    units: [{ value: 'pack',    label: t.units.pack }, { value: 'bottle', label: t.units.bottle }, { value: 'box', label: t.units.box }] },
    };

    const ALL_UNITS = [
        { value: 'piece',   label: t.units.piece },
        { value: 'strip',   label: t.units.strip },
        { value: 'box',     label: t.units.box },
        { value: 'bottle',  label: t.units.bottle },
        { value: 'tube',    label: t.units.tube },
        { value: 'vial',    label: t.units.vial },
        { value: 'inhaler', label: t.units.inhaler },
        { value: 'pack',    label: t.units.pack },
    ];

    const [formData, setFormData] = useState({
        medicine_id: '',
        stock_batch_id: '',
        adjustment_type: 'damage',
        adjustment_unit: 'piece',
        qty_in_units: '',
        note: ''
    });

    const [selectedMedicine, setSelectedMedicine] = useState(null);
    const [medicineSearch, setMedicineSearch] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const medicineRef = useRef(null);

    const { data: medicinesData } = useGetActiveMedicinesQuery();
    const medicines = medicinesData?.data || [];

    // Filtered list for search
    const filteredMedicines = medicines.filter(m =>
        m.medicine_name.toLowerCase().includes(medicineSearch.toLowerCase())
    );

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (medicineRef.current && !medicineRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectMedicine = (med) => {
        setMedicineSearch(med.medicine_name);
        setShowDropdown(false);
        const primaryUnit = med?.dosage_form && DOSAGE_UNIT_MAP[med.dosage_form]
            ? DOSAGE_UNIT_MAP[med.dosage_form].primary
            : 'piece';
        setSelectedMedicine(med);
        setFormData(prev => ({ ...prev, medicine_id: med.id, stock_batch_id: '', adjustment_unit: primaryUnit }));
        fetchBatches(med.id);
    };

    const handleClearMedicine = () => {
        setMedicineSearch('');
        setSelectedMedicine(null);
        setFormData(prev => ({ ...prev, medicine_id: '', stock_batch_id: '', adjustment_unit: 'piece' }));
    };

    // Fetch batches when medicine changes
    const [fetchBatches, { data: batchesData, isFetching: isFetchingBatches }] = useLazyGetMedicineBatchesQuery();
    const batches = batchesData?.data || [];

    // Derive available units based on selected medicine's dosage form
    const availableUnits = selectedMedicine?.dosage_form && DOSAGE_UNIT_MAP[selectedMedicine.dosage_form]
        ? DOSAGE_UNIT_MAP[selectedMedicine.dosage_form].units
        : ALL_UNITS;

    // medicine_id is now set directly by handleSelectMedicine / handleClearMedicine

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden overflow-y-auto max-h-[85vh] custom-scrollbar"
        >
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t.form.title}</h2>
                    <p className="text-sm font-medium text-slate-500 mt-1">{t.form.subtitle}</p>
                </div>
                <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                    <X size={20} className="text-slate-400" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-slate-800">
                    {/* Medicine Search */}
                    <div className="space-y-2" ref={medicineRef}>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Package size={12} /> {t.form.select_medicine}
                        </label>
                        <div className="relative">
                            <div className="relative flex items-center">
                                <Search size={15} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={medicineSearch}
                                    onChange={e => { setMedicineSearch(e.target.value); setShowDropdown(true); }}
                                    onFocus={() => setShowDropdown(true)}
                                    placeholder={t.form.search_placeholder}
                                    required={!formData.medicine_id}
                                    className="w-full pl-9 pr-9 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all"
                                />
                                {selectedMedicine && (
                                    <button
                                        type="button"
                                        onClick={handleClearMedicine}
                                        className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Selected badge */}
                            {selectedMedicine && (
                                <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-indigo-600">
                                    <CheckCircle2 size={12} />
                                    <span>{selectedMedicine.medicine_name}</span>
                                    {selectedMedicine.dosage_form && (
                                        <span className="ml-1 px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded-full text-[10px] font-black uppercase tracking-wide">
                                            {selectedMedicine.dosage_form}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Dropdown list */}
                            {showDropdown && filteredMedicines.length > 0 && (
                                <ul className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto custom-scrollbar">
                                    {filteredMedicines.map(m => (
                                        <li
                                            key={m.id}
                                            onMouseDown={() => handleSelectMedicine(m)}
                                            className={`flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-indigo-50 transition-colors text-sm ${
                                                formData.medicine_id === m.id ? 'bg-indigo-50 text-indigo-700 font-black' : 'text-slate-700 font-semibold'
                                            }`}
                                        >
                                            <span>{m.medicine_name}</span>
                                            {m.dosage_form && (
                                                <span className="text-[10px] font-black uppercase tracking-wide text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                                    {m.dosage_form}
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {showDropdown && filteredMedicines.length === 0 && medicineSearch && (
                                <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl px-4 py-3 text-sm text-slate-400 font-medium">
                                    {t.form.no_medicine_found}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Batch Selection */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Hash size={12} /> {t.form.select_batch}
                        </label>
                        <select
                            name="stock_batch_id"
                            value={formData.stock_batch_id}
                            onChange={handleChange}
                            required
                            disabled={!formData.medicine_id || isFetchingBatches}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all cursor-pointer disabled:opacity-50"
                        >
                            <option value="">{isFetchingBatches ? t.form.loading_batches : t.form.choose_batch}</option>
                            {batches.map(b => (
                                <option key={b.id} value={b.id}>
                                    {b.batch_number} - {translations.grn?.expiry_date || (language === 'BAN' ? 'মেয়াদ শেষ' : 'Expiry Date')}: {b.expiry_date} ({t.form.avail}: {b.qty_tablets_remaining} {t.units.piece})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Adjustment Type */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <AlertCircle size={12} /> {t.form.adjustment_reason}
                        </label>
                        <select
                            name="adjustment_type"
                            value={formData.adjustment_type}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all cursor-pointer"
                        >
                            {Object.entries(t.types).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Qty & Unit */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 text-slate-800 font-bold">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <PlusCircle size={12} /> {t.form.quantity}
                            </label>
                            <input
                                type="number"
                                name="qty_in_units"
                                value={formData.qty_in_units}
                                onChange={handleChange}
                                required
                                min="1"
                                placeholder={t.form.enter_qty}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Layers size={12} /> {t.form.unit}
                            </label>
                            <select
                                name="adjustment_unit"
                                value={formData.adjustment_unit}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all cursor-pointer"
                            >
                                {availableUnits.map(u => (
                                    <option key={u.value} value={u.value}>{u.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Conversion Info */}
                {selectedMedicine && formData.qty_in_units && (
                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-50">
                            <Info size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-indigo-400 uppercase tracking-widest">{t.form.stock_impact}</p>
                            <p className="text-sm font-bold text-slate-700">
                                {t.form.impact_desc
                                    .replace('{type}', formData.adjustment_type === 'opening_balance' ? t.form.increase : t.form.decrease)
                                    .replace('{qty}', formData.qty_in_units)
                                    .replace('{unit}', t.units[formData.adjustment_unit] || formData.adjustment_unit)}
                            </p>
                        </div>
                    </div>
                )}

                {/* Note */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <FileText size={12} /> {t.form.internal_note}
                    </label>
                    <textarea
                        name="note"
                        value={formData.note}
                        onChange={handleChange}
                        rows="3"
                        placeholder={t.form.note_placeholder}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-400 text-slate-600"
                    ></textarea>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-3 rounded-xl text-sm font-black text-slate-500 hover:bg-slate-100 transition-all uppercase tracking-widest"
                    >
                        {t.form.cancel}
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-sm font-black hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-600/20 transition-all uppercase tracking-widest flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <RefreshCw size={18} className="animate-spin" />
                        ) : (
                            <Save size={18} />
                        )}
                        {t.form.save}
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

export default StockAdjustmentForm;
