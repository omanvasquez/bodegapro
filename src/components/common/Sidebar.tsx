import React from 'react';
import { ShoppingCart, Package, Users, BarChart3, Settings, ShieldCheck } from 'lucide-react';
import { TabType } from './BottomNav';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenSuperAdmin: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onOpenSuperAdmin }) => {
  const { totalItemsCount } = useCart();
  const { isSuperAdmin } = useAuth();

  const navItems = [
    { id: 'pos' as TabType, label: 'Punto de Venta (Caja)', icon: ShoppingCart, badge: totalItemsCount },
    { id: 'inventory' as TabType, label: 'Inventario & Precios', icon: Package },
    { id: 'customers' as TabType, label: 'Clientes & Fiados', icon: Users },
    { id: 'reports' as TabType, label: 'Informes & Cierre', icon: BarChart3 },
    { id: 'settings' as TabType, label: 'Configuración Local', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-[calc(100vh-4rem)] sticky top-16 select-none shrink-0">
      <div className="p-4 space-y-1 flex-1">
        <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Navegación Principal
        </p>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition ${
                isActive
                  ? 'bg-brand-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-brand-emerald-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && item.badge > 0 ? (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    isActive
                      ? 'bg-brand-emerald-500 text-slate-950 font-black'
                      : 'bg-slate-200 text-slate-800'
                  }`}
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Superadmin shortcut in desktop */}
      {isSuperAdmin && (
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={onOpenSuperAdmin}
            className="w-full flex items-center space-x-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold hover:bg-amber-100 transition"
          >
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Panel Superadmin</span>
          </button>
        </div>
      )}

      {/* Desktop footer info */}
      <div className="p-4 border-t border-slate-200 text-xs text-slate-400">
        <p className="font-semibold text-slate-600">BodegaPro v1.0</p>
        <p className="text-[11px] text-slate-400">Por Oman Vásquez</p>
      </div>
    </aside>
  );
};
