import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  Store, 
  Phone, 
  User, 
  Save, 
  RefreshCw, 
  ShieldCheck, 
  Info, 
  Download, 
  Clock 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { dbInit } from '../../services/localDatabase';

interface SettingsViewProps {
  onOpenAbout: () => void;
  onOpenSuperAdmin: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenAbout, onOpenSuperAdmin }) => {
  const { tenant, isSuperAdmin, trialDaysRemaining, updateTenantProfile } = useAuth();
  const { rates, setManualOverride, refreshRates, isLoading } = useCurrency();

  const [storeName, setStoreName] = useState<string>(tenant?.name || '');
  const [ownerName, setOwnerName] = useState<string>(tenant?.ownerName || '');
  const [phone, setPhone] = useState<string>(tenant?.phone || '');
  const [isSavedNotice, setIsSavedNotice] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Sync state if tenant updates from Firebase or local storage
  React.useEffect(() => {
    if (tenant) {
      setStoreName(tenant.name);
      setOwnerName(tenant.ownerName);
      setPhone(tenant.phone);
    }
  }, [tenant?.name, tenant?.ownerName, tenant?.phone]);

  // Rate override
  const [manualRateActive, setManualRateActive] = useState<boolean>(rates.manualOverride.active);
  const [manualRateVal, setManualRateVal] = useState<string>(rates.manualOverride.rate.toString());

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    setIsSaving(true);
    try {
      await updateTenantProfile({
        name: storeName.trim() || tenant.name,
        ownerName: ownerName.trim() || tenant.ownerName,
        phone: phone.trim() || tenant.phone,
      });
      setIsSavedNotice(true);
      setTimeout(() => setIsSavedNotice(false), 3000);
    } catch (err) {
      console.error('Error guardando negocio:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveRateOverride = () => {
    const val = parseFloat(manualRateVal);
    if (!isNaN(val) && val > 0) {
      setManualOverride(manualRateActive, val);
      alert('Tasa de cambio configurada exitosamente.');
    }
  };

  const handleExportBackup = () => {
    const data = {
      tenant: dbInit.getTenant(),
      products: dbInit.getProducts(),
      customers: dbInit.getCustomers(),
      sales: dbInit.getSales(),
      creditTransactions: dbInit.getTransactions(),
      wastes: dbInit.getWastes(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bodegapro_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-50 overflow-hidden pb-16 md:pb-0">
      
      {/* Top Header */}
      <div className="p-4 bg-white border-b border-slate-200 shrink-0">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          Configuración Local
        </h2>
        <p className="text-xs text-slate-500">
          Personaliza los datos de tu bodega, tasas y copias de seguridad.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 max-w-2xl mx-auto w-full">
        
        {/* Account Status Card */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-brand-emerald-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Estado de la Cuenta
              </span>
              <span className="text-sm font-black text-slate-900 capitalize block">
                {tenant.status === 'trial' ? `Acceso Temporal (${trialDaysRemaining} días restantes)` : 'Licencia Comercial Activa'}
              </span>
            </div>
          </div>
          {isSuperAdmin && (
            <button
              onClick={onOpenSuperAdmin}
              className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold hover:bg-amber-200 transition"
            >
              Superadmin
            </button>
          )}
        </div>

        {/* Store Profile Form */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Store className="w-4 h-4 text-brand-emerald-600" />
            <span>Datos de la Bodega</span>
          </h3>

          <form onSubmit={handleSaveBusiness} className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Nombre Comercial del Negocio:</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nombre del Encargado / Dueño:</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Teléfono (para WhatsApp):</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              {isSavedNotice && (
                <span className="text-xs text-brand-emerald-600 font-bold">
                  ✓ Datos actualizados correctamente.
                </span>
              )}
              <div className="ml-auto">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-brand-slate-900 hover:bg-brand-slate-800 disabled:opacity-50 text-white font-bold text-xs flex items-center space-x-1.5 transition shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Exchange Rate Override */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
              <span>Tasa de Cambio y Override Manual</span>
            </h3>
            <button
              onClick={refreshRates}
              disabled={isLoading}
              className="text-xs text-brand-emerald-600 hover:underline flex items-center space-x-1"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sincronizar BCV</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-600">Tasa Oficial DolarAPI (BCV):</span>
              <span className="font-black text-slate-900 text-sm">Bs {rates.bcv.toFixed(2)}</span>
            </div>

            <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-800">
              <input
                type="checkbox"
                checked={manualRateActive}
                onChange={(e) => setManualRateActive(e.target.checked)}
                className="rounded text-brand-emerald-600"
              />
              <span>Forzar Tasa Manual Personalizada (Override)</span>
            </label>

            {manualRateActive && (
              <div className="space-y-1 pt-1">
                <label className="font-bold text-slate-700">Valor de la Tasa Manual (Bs/$):</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    step="0.01"
                    value={manualRateVal}
                    onChange={(e) => setManualRateVal(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 font-black text-sm"
                  />
                  <button
                    onClick={handleSaveRateOverride}
                    className="px-4 py-2 bg-brand-emerald-600 hover:bg-brand-emerald-700 text-white font-bold rounded-xl"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Data Backup & Info */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Download className="w-4 h-4 text-slate-600" />
            <span>Copia de Respaldo Local</span>
          </h3>
          <p className="text-xs text-slate-500">
            Descarga un archivo JSON con todo tu catálogo, ventas y cuentas de fiados para tener un respaldo offline en tu dispositivo.
          </p>
          <button
            onClick={handleExportBackup}
            className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-center space-x-2 transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Descargar Respaldo JSON</span>
          </button>
        </div>

        {/* About trigger */}
        <div className="pt-2 text-center">
          <button
            onClick={onOpenAbout}
            className="text-xs text-slate-400 hover:text-slate-700 font-semibold flex items-center justify-center space-x-1 mx-auto"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Acerca de BodegaPro v1.0 • Oman Vásquez</span>
          </button>
        </div>
      </div>
    </div>
  );
};
