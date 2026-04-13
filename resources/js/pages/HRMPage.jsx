import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Shield, Clock, Plus, Calendar, ListChecks, Fingerprint, DollarSign } from 'lucide-react';
import StaffTable from '../components/HRM/StaffTable';
import StaffForm from '../components/HRM/StaffForm';
import RoleTable from '../components/HRM/RoleTable';
import RoleForm from '../components/HRM/RoleForm';
import ShiftTable from '../components/HRM/ShiftTable';
import ShiftForm from '../components/HRM/ShiftForm';
import AttendanceTable from '../components/HRM/AttendanceTable';
import AttendanceForm from '../components/HRM/AttendanceForm';
import LeaveTable from '../components/HRM/LeaveTable';
import LeaveForm from '../components/HRM/LeaveForm';
import LeaveTypeTable from '../components/HRM/LeaveTypeTable';
import LeaveTypeForm from '../components/HRM/LeaveTypeForm';
import PayrollTable from '../components/HRM/PayrollTable';
import PayrollForm from '../components/HRM/PayrollForm';
import { Toaster } from 'react-hot-toast';

const HRMPage = () => {
    const [activeTab, setActiveTab] = useState('staff');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const tabs = [
        { id: 'staff', label: 'Staff Management', icon: Users, color: 'blue' },
        { id: 'roles', label: 'Roles', icon: Shield, color: 'slate' },
        { id: 'shifts', label: 'Shifts', icon: Clock, color: 'indigo' },
        { id: 'attendance', label: 'Attendance', icon: Fingerprint, color: 'emerald' },
        { id: 'leaves', label: 'Leave Applications', icon: Calendar, color: 'indigo' },
        { id: 'leave-types', label: 'Leave Categories', icon: ListChecks, color: 'slate' },
        { id: 'payroll', label: 'Payroll', icon: DollarSign, color: 'slate' },
    ];

    const handleAdd = () => {
        setEditingItem(null);
        setIsFormOpen(true);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setIsFormOpen(true);
    };

    const handleClose = () => {
        setIsFormOpen(false);
        setTimeout(() => setEditingItem(null), 300);
    };

    const renderForm = () => {
        switch (activeTab) {
            case 'staff': return <StaffForm staff={editingItem} onClose={handleClose} />;
            case 'roles': return <RoleForm role={editingItem} onClose={handleClose} />;
            case 'shifts': return <ShiftForm shift={editingItem} onClose={handleClose} />;
            case 'attendance': return <AttendanceForm attendance={editingItem} onClose={handleClose} />;
            case 'leaves': return <LeaveForm leave={editingItem} onClose={handleClose} />;
            case 'leave-types': return <LeaveTypeForm leaveType={editingItem} onClose={handleClose} />;
            case 'payroll': return <PayrollForm payroll={editingItem} onClose={handleClose} />;
            default: return null;
        }
    };

    return (
        <DashboardLayout noScroll>
            <Toaster position="top-right" />
            
            <div className="flex flex-col h-full min-h-0">
                {/* Page Header */}
                <div className="shrink-0 mb-6 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                                <Users size={16} className="text-blue-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Human Resource Management</h1>
                        </div>
                        <p className="text-sm text-slate-500 ml-11">Manage organization personnel, attendance tracking, payroll, and leave applications.</p>
                    </div>
                </div>

                {/* Local Navigation Tabs */}
                <div className="shrink-0 mb-6 flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setEditingItem(null); setIsFormOpen(false); }}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    isActive 
                                        ? 'bg-white text-slate-900 shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <Icon size={14} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Dynamic Content Area */}
                <div className="flex-1 min-h-0 relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="h-full"
                        >
                            {activeTab === 'staff' && <StaffTable onAdd={handleAdd} onEdit={handleEdit} />}
                            {activeTab === 'roles' && <RoleTable onAdd={handleAdd} onEdit={handleEdit} />}
                            {activeTab === 'shifts' && <ShiftTable onAdd={handleAdd} onEdit={handleEdit} />}
                            {activeTab === 'attendance' && <AttendanceTable onAdd={handleAdd} onEdit={handleEdit} />}
                            {activeTab === 'leaves' && <LeaveTable onAdd={handleAdd} onEdit={handleEdit} />}
                            {activeTab === 'leave-types' && <LeaveTypeTable onAdd={handleAdd} onEdit={handleEdit} />}
                            {activeTab === 'payroll' && <PayrollTable onAdd={handleAdd} onEdit={handleEdit} />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Universal Form Modal */}
            <AnimatePresence>
                {isFormOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[60] flex items-center justify-center p-4 overflow-y-auto"
                        onClick={handleClose}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className={`w-full ${activeTab === 'staff' ? 'max-w-4xl' : 'max-w-md'}`}
                        >
                            {renderForm()}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};

export default HRMPage;
