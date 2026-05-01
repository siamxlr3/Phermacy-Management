import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Truck, 
  Settings, 
  Plus, 
  ArrowRightLeft, 
  ChevronRight, 
  Database, 
  FileText, 
  Pill,
  BarChart3,
  ArrowLeftRight,
  Wallet,
  Users
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useGetAddressesQuery } from '../store/api/settingApi';

const navigationGroups = [
  {
    title: 'Main',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    ]
  },
  {
    title: 'Sales',
    items: [
      { icon: ShoppingCart, label: 'Point of Sale', path: '/pos' },
      { icon: LayoutDashboard, label: 'All Sales', path: '/sales' },
      { icon: ArrowRightLeft, label: 'Returns & Refunds', path: '/sales/returns' },
      { icon: BarChart3, label: 'Reports', path: '/sales/reports' },
    ]
  },
  {
    title: 'Purchasing',
    items: [
      { icon: Truck, label: 'Suppliers', path: '/suppliers' },
      { icon: FileText, label: 'Orders', path: '/orders' },
      { icon: ArrowLeftRight, label: 'Returns', path: '/returns' },
    ]
  },
  {
    title: 'Accounting',
    items: [
      { icon: Wallet, label: 'Expenses', path: '/expenses' },
    ]
  },
  {
    title: 'Inventory',
    items: [
      { icon: Pill, label: 'Medicine List', path: '/medicines' },
      { icon: BarChart3, label: 'Stock Levels', path: '/stock' },
      { icon: FileText, label: 'Reports', path: '/inventory/reports' },
    ]
  },
  {
    title: 'Management',
    items: [
      { icon: Users, label: 'HRM', path: '/hrm' },
    ]
  },
  {
    title: 'System',
    items: [
      { icon: Settings, label: 'System Settings', path: '/settings' },
    ]
  }
];

/**
 * SidebarItem — single stable layout: icon anchored, label fades via clip + opacity.
 * No layout-swap between open/closed, which was the cause of the shaking.
 */
const SidebarItem = ({ icon: Icon, label, path, isSidebarOpen }) => {
  return (
    <NavLink
      to={path}
      end
      className={({ isActive }) => cn(
        'flex items-center w-full rounded-xl relative cursor-pointer group',
        'transition-colors duration-200',
        // When open: full-width row with padding and background
        isSidebarOpen && (isActive
          ? 'gap-3 px-3 py-2.5 bg-emerald-50 text-emerald-600'
          : 'gap-3 px-3 py-2.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
        ),
        // When collapsed: no background on the NavLink itself, icon container handles it
        !isSidebarOpen && 'justify-center py-1.5 text-zinc-500'
      )}
      style={{ transition: 'padding 400ms cubic-bezier(0.4,0,0.2,1), background-color 150ms' }}
    >
      {({ isActive }) => (
        <>
          {/* Active left accent bar — only when expanded */}
          {isActive && isSidebarOpen && (
            <div className="absolute left-0 w-[3px] h-5 bg-emerald-500 rounded-full" />
          )}

          {isSidebarOpen ? (
            /* Expanded: icon inline */
            <Icon
              size={18}
              className={cn(
                'shrink-0 transition-colors duration-200',
                isActive ? 'text-emerald-600' : 'text-zinc-400 group-hover:text-zinc-700'
              )}
            />
          ) : (
            /* Collapsed: icon in a centered square with its own background */
            <div className={cn(
              'w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 relative',
              isActive
                ? 'bg-emerald-50 text-emerald-600 shadow-sm ring-1 ring-emerald-100'
                : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 group-hover:bg-zinc-100 group-hover:text-zinc-700'
            )}>
              {isActive && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-[2.5px] bg-emerald-500 rounded-full" />
              )}
              <Icon size={18} className="shrink-0" />
              {/* Tooltip */}
              <div className="absolute left-full ml-3 px-3 py-1.5 bg-zinc-900 text-white text-[11px] font-semibold rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap z-[100] pointer-events-none shadow-xl transition-opacity duration-150">
                {label}
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-zinc-900 rotate-45" />
              </div>
            </div>
          )}

          {/* Label — clips out when collapsed */}
          {isSidebarOpen && (
            <span
              className={cn(
                'text-sm font-medium whitespace-nowrap overflow-hidden',
                isSidebarOpen ? 'max-w-[160px] opacity-100' : 'max-w-0 opacity-0'
              )}
              style={{
                transition: isSidebarOpen
                  ? 'max-width 400ms cubic-bezier(0.4,0,0.2,1) 80ms, opacity 250ms ease 120ms'
                  : 'max-width 350ms cubic-bezier(0.4,0,0.2,1), opacity 150ms ease'
              }}
            >
              {label}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
};

/**
 * SidebarSection — section header that clips out gracefully.
 */
const SidebarSection = ({ group, isSidebarOpen }) => {
  return (
    <div className="space-y-0.5">
      <div className={cn(
        'flex items-center px-3 mt-6 mb-2 h-5 overflow-hidden',
        isSidebarOpen ? 'justify-start' : 'justify-center'
      )}>
        {isSidebarOpen ? (
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 whitespace-nowrap transition-opacity duration-300">
            {group.title}
          </span>
        ) : (
          <div className="h-px bg-zinc-200 w-6" />
        )}
      </div>

      <div className="space-y-0.5 px-2">
        {group.items.map((item) => (
          <SidebarItem
            key={item.path}
            {...item}
            isSidebarOpen={isSidebarOpen}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Main Sidebar Component
 */
const Sidebar = ({ isOpen, setIsOpen }) => {
  const { data, isLoading } = useGetAddressesQuery({ page: 1, perPage: 1, search: '' });
  const activeBranchName = data?.data?.[0]?.name || 'Pharmly';

  return (
    <aside
      className={cn(
        'h-screen bg-white border-r border-zinc-200 flex flex-col relative z-20 shadow-[1px_0_0_rgba(0,0,0,0.06)]',
        isOpen ? 'w-[240px]' : 'w-[68px]'
      )}
      style={{ transition: 'width 400ms cubic-bezier(0.4,0,0.2,1)' }}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-3.5 top-10 bg-white border border-zinc-200 rounded-full w-7 h-7 flex items-center justify-center shadow-md text-zinc-400 hover:text-emerald-500 hover:border-emerald-200 z-50 transition-all duration-200 hover:scale-110 active:scale-90"
      >
        <ChevronRight
          size={14}
          style={{ transition: 'transform 400ms cubic-bezier(0.4,0,0.2,1)' }}
          className={cn(isOpen && 'rotate-180')}
        />
      </button>

      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-6 overflow-hidden shrink-0">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md", isLoading ? "bg-emerald-500/50 animate-pulse" : "bg-emerald-600 shadow-emerald-200/60")}>
          {!isLoading && <span className="text-white font-black text-xl">{activeBranchName.charAt(0).toUpperCase()}</span>}
        </div>
        <div
          className={cn(
            'flex flex-col overflow-hidden justify-center',
            isOpen ? 'max-w-[160px] opacity-100' : 'max-w-0 opacity-0'
          )}
          style={{
            transition: isOpen
              ? 'max-width 400ms cubic-bezier(0.4,0,0.2,1) 80ms, opacity 280ms ease 120ms'
              : 'max-width 350ms cubic-bezier(0.4,0,0.2,1), opacity 120ms ease'
          }}
        >
          {isLoading ? (
            <div className="h-5 w-24 bg-zinc-200 rounded animate-pulse"></div>
          ) : (
            <span className="font-black text-lg text-zinc-900 tracking-tight leading-none whitespace-nowrap truncate">
              {activeBranchName}
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 pb-6 overflow-y-auto overflow-x-hidden">
        {navigationGroups.map((group) => (
          <SidebarSection
            key={group.title}
            group={group}
            isSidebarOpen={isOpen}
          />
        ))}
      </nav>

      <style dangerouslySetInnerHTML={{ __html: `
        nav::-webkit-scrollbar { width: 3px; }
        nav::-webkit-scrollbar-track { background: transparent; }
        nav::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 10px; }
        nav:hover::-webkit-scrollbar-thumb { background: #d4d4d8; }
      `}} />
    </aside>
  );
};

export default Sidebar;
