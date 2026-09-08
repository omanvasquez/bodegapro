import React, { useState, useEffect } from 'react';
import { 
  Store, 
  RefreshCw, 
  SlidersHorizontal, 
  Info, 
  ShieldCheck, 
  Wifi, 
  WifiOff, 
  Check,
  LogOut,
  Download
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onOpenAbout: () => void;
  onOpenSuperAdmin: () => void;
  onOpenInstall?: () => void;
  isInstalled?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenAbout, 
  onOpenSuperAdmin,
  onOpenInstall,
  isInstalled = false,
}) => {
  const { effectiveRate, isOverride, isLoading, refreshRates, setManualOverride, rates } = useCurrency();
  const { tenant, isSuperAdmin, logout, user } = useAuth();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showRateModal, setShowRateModal] = useState<boolean>(false);
  const [overrideInput, setOverrideInput] = useState<string>(rates.manualOverride.rate.toString());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSaveRate = () => {
    const val = parseFloat(overrideInput);
    if (!isNaN(val) && val > 0) {
      setManualOverride(true, val);
      setShowRateModal(false);
    }
  };

  const handleResetRate = () => {
    setManualOverride(false);
    setShowRateModal(false);
  };

  return (
    <header className="bg-brand-slate-900 text-white sticky top-0 z-30 shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Store Name */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-emerald-500 to-emerald-300 flex items-center justify-center shadow-md">
            <Store className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-lg tracking-tight">BodegaPro</span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest bg-brand-emerald-500/20 text-brand-emerald-500 px-2 py-0.5 rounded-full border border-brand-emerald-500/30">
                PWA v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-[140px] sm:max-w-xs">
              {tenant?.name || 'Mi Comercio'}
            </p>
          </div>
        </div>

        {/* Action Controls & Rate Pill */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Rate Button */}
          <button
            onClick={() => {
              setOverrideInput(effectiveRate.toString());
              setShowRateModal(true);
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition shadow-sm ${
              isOverride
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750'
            }`}
            title="Tasa de cambio activa. Clic para ajustar."
          >
            <span className="text-[11px] text-slate-400 font-normal">Tasa:</span>
            <span className="font-bold text-white">Bs {effectiveRate.toFixed(2)}</span>
            {isOverride ? (
              <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded uppercase">
                Manual
              </span>
            ) : (
              <span className="text-[9px] bg-slate-700 text-slate-300 px-1 rounded">
                BCV
              </span>
            )}
          </button>

          {/* Refresh Rate Icon */}
          <button
            onClick={refreshRates}
            disabled={isLoading}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Sincronizar tasa con DolarAPI"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-brand-emerald-500' : ''}`} />
          </button>

          {/* Online/Offline status pill */}
          <div
            className={`hidden md:flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-medium ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Install App Button */}
          {!isInstalled && onOpenInstall && (
            <button
              onClick={onOpenInstall}
              className="flex items-center space-x-1.5 bg-brand-emerald-500 hover:bg-brand-emerald-400 text-slate-950 font-black px-2.5 sm:px-3 py-1.5 rounded-xl text-xs shadow-md transition"
              title="Instalar BodegaPro en tu PC o Teléfono"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar App</span>
            </button>
          )}

          {/* Superadmin Button (Only Oman) */}
          {isSuperAdmin && (
            <button
              onClick={onOpenSuperAdmin}
              className="flex items-center space-x-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2.5 py-1.5 rounded-xl text-xs font-bold transition"
              title="Panel Superadmin de Suscripciones"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}

          {/* About Modal Trigger */}
          <button
            onClick={onOpenAbout}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Acerca de BodegaPro"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
            title={`Cerrar sesión (${user?.email})`}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal / Popover para Ajustar Tasa */}
      {showRateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full text-slate-800 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-5 h-5 text-slate-700" />
                <h3 className="font-bold text-base text-slate-900">Ajuste de Tasa</h3>
              </div>
              <span className="text-xs text-slate-500">BCV: Bs {rates.bcv.toFixed(2)}</span>
            </div>

            <p className="text-xs text-slate-500">
              Puedes forzar una tasa manual si la conexión falla o si operas con una tasa paralela acordada en tu zona.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Tasa en Bolívares por Dólar (Bs/$):</label>
              <input
                type="number"
                step="0.01"
                value={overrideInput}
                onChange={(e) => setOverrideInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={handleResetRate}
                className="py-2.5 px-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Restablecer a BCV
              </button>
              <button
                onClick={handleSaveRate}
                className="py-2.5 px-3 rounded-xl bg-brand-emerald-600 text-white text-xs font-bold hover:bg-brand-emerald-700 transition flex items-center justify-center space-x-1"
              >
                <Check className="w-4 h-4" />
                <span>Aplicar Tasa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
