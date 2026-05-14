import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../language/GlobalTranslate.jsx';


const Header = () => {
  const { language, translations, toggleLanguage } = useLanguage();
  const location = useLocation();
  const currentPath = location.pathname;
  const h = translations?.header || {};

  const pathTitleMap = {
    '/dashboard': h.dashboard,
    '/pos': h.pos,
    '/pos/new': h.pos,
    '/sales': h.sales,
    '/sales-history': h.sales,
    '/sales/returns': h.returns,
    '/inventory/medicines': h.medicines,
    '/inventory/stock': h.stock,
    '/inventory/reports': h.inventory_reports,
    '/suppliers': h.suppliers,
    '/orders': h.orders,
    '/returns': h.purchasing_returns,
    '/expenses': h.expenses,
    '/hrm': h.hrm,
    '/cash-register': h.cash_register,
    '/settings': h.settings,
  };

  const { title, subtitle } = pathTitleMap[currentPath] || h.generic || { title: 'Pharmacy System', subtitle: 'Management Dashboard' };

  return (
    <header className="h-[80px] bg-white border-b border-zinc-100 px-8 flex items-center justify-between sticky top-0 z-10 shrink-0">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight transition-all duration-300">{title}</h1>
        <p className="text-sm text-zinc-500 mt-0.5 tracking-wide">{subtitle}</p>
      </div>

      <div className="flex items-center gap-6">
        {/* Language Toggle */}
        <button 
          onClick={toggleLanguage}
          className="flex items-center gap-2 h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-all group"
        >
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "text-xs font-bold px-1.5 py-0.5 rounded transition-all",
              language === 'ENG' ? "bg-emerald-600 text-white" : "text-zinc-400 group-hover:text-zinc-600"
            )}>ENG</span>
            <div className="w-px h-3 bg-zinc-200" />
            <span className={cn(
              "text-xs font-bold px-1.5 py-0.5 rounded transition-all",
              language === 'BAN' ? "bg-emerald-600 text-white" : "text-zinc-400 group-hover:text-zinc-600"
            )}>BAN</span>
          </div>
        </button>
      </div>
    </header>
  );
};

export default Header;
