import React from 'react';
import { ShoppingCart, Package, Users, BarChart3, Settings } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export type TabType = 'pos' | 'inventory' | 'customers' | 'reports' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { totalItemsCount } = useCart();

  const navItems = [
    { id: 'pos' as TabType, label: 'Caja', icon: ShoppingCart, badge: totalItemsCount },
    { id: 'inventory' as TabType, label: 'Inventario', icon: Package },
    { id: 'customers' as TabType, label: 'Fiados', icon: Users },
    { id: 'reports' as TabType, label: 'Informes', icon: BarChart3 },
    { id: 'settings' as TabType, label: 'Ajustes', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 shadow-lg">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
                isActive
                  ? 'text-brand-emerald-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2.5 bg-brand-emerald-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
