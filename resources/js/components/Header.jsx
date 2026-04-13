import { Search, Bell, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLocation } from 'react-router-dom';

const pathTitleMap = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview of pharmacy operations' },
  '/pos/new': { title: 'New Sale (POS)', subtitle: 'Create a new transaction' },
  '/sales': { title: 'Sales History', subtitle: 'View previous transactions' },
  '/sales/returns': { title: 'Sales Returns', subtitle: 'Manage returned items' },
  '/inventory/medicines': { title: 'Medicines', subtitle: 'Manage drug inventory' },
  '/inventory/stock': { title: 'Stock Levels', subtitle: 'Monitor availability' },
  '/inventory/adjustments': { title: 'Stock Adjustments', subtitle: 'Manual inventory corrections' },
  '/inventory/interactions': { title: 'Drug Interactions', subtitle: 'Safety and compatibility checks' },
  '/purchasing/suppliers': { title: 'Suppliers', subtitle: 'Manage vendors and contacts' },
  '/purchasing/orders': { title: 'Purchase Orders', subtitle: 'Order new inventory' },
  '/purchasing/grn': { title: 'Good Received Note (GRN)', subtitle: 'Log incoming stock' },
  '/purchasing/returns': { title: 'Purchase Returns', subtitle: 'Return stock to suppliers' },
  '/patients': { title: 'Patients', subtitle: 'Manage patient profiles' },
  '/patients/allergies': { title: 'Allergies', subtitle: 'Patient safety records' },
  '/patients/history': { title: 'Medical History', subtitle: 'Previous prescriptions and visits' },
  '/reports/sales': { title: 'Sales Reports', subtitle: 'Analysis of revenue' },
  '/reports/inventory': { title: 'Inventory Reports', subtitle: 'Stock movement analysis' },
  '/reports/purchase': { title: 'Purchase Reports', subtitle: 'Supplier performance' },
  '/reports/patients': { title: 'Patient Reports', subtitle: 'Demographics and history' },
  '/alerts': { title: 'System Alerts', subtitle: 'Immediate action items' },
  '/settings/users': { title: 'Users & Permissions', subtitle: 'Manage staff access' },
  '/settings/audit': { title: 'Audit Trail', subtitle: 'Security and change logs' },
  '/settings': { title: 'System Settings', subtitle: 'Global configurations' },
};

const Header = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { title, subtitle } = pathTitleMap[currentPath] || { title: 'Pharmacy System', subtitle: 'Management Dashboard' };

  return (
    <header className="h-[80px] bg-white border-b border-zinc-100 px-8 flex items-center justify-between sticky top-0 z-10 shrink-0">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight transition-all duration-300">{title}</h1>
        <p className="text-sm text-zinc-500 mt-0.5 tracking-wide">{subtitle}</p>
      </div>

      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="relative w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text" 
            placeholder="Search products..." 
            className="w-full h-11 bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Notifications */}
        <button className="w-11 h-11 flex items-center justify-center bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-all relative">
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>
      </div>
    </header>
  );
};

export default Header;
