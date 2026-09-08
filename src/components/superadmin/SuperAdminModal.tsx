import React from 'react';
import { X, ShieldAlert, CheckCircle2, XCircle, Store, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TenantStatus } from '../../types';

interface SuperAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SuperAdminModal: React.FC<SuperAdminModalProps> = ({ isOpen, onClose }) => {
  const { isSuperAdmin, allTenantsForSuperadmin, updateTenantStatus } = useAuth();

  if (!isOpen) return null;

  if (!isSuperAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">Acceso Denegado</h3>
          <p className="text-xs text-slate-500">
            Este panel está reservado exclusivamente para el Superadministrador (omanjrvasquez@gmail.com).
          </p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-800 text-white rounded-xl text-sm font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Panel Superadmin</h2>
              <p className="text-xs text-amber-300">
                Control de Suscripciones • Oman Vásquez
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start space-x-2">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Aquí puedes activar o suspender el acceso de cualquier bodega registrada. La conciliación de pagos y fechas maestras se administra en tu sistema central.
            </span>
          </div>

          <div className="space-y-3">
            {allTenantsForSuperadmin.map((tenant) => {
              const isTrial = tenant.status === 'trial';
              const isActive = tenant.status === 'activo';
              const isInactive = tenant.status === 'inactivo';

              return (
                <div
                  key={tenant.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 gap-4 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Store className="w-4 h-4 text-slate-500" />
                      <span className="font-bold text-sm text-slate-800">{tenant.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : isTrial
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {tenant.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Encargado: <span className="font-semibold text-slate-700">{tenant.ownerName}</span> • {tenant.phone}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      ID: {tenant.id} • {tenant.ownerEmail}
                    </p>
                  </div>

                  {/* Toggle Button */}
                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    <button
                      onClick={() => {
                        const nextStatus: TenantStatus = isActive ? 'inactivo' : 'activo';
                        updateTenantStatus(tenant.id, nextStatus);
                      }}
                      className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                        isActive
                          ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {isActive ? (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Suspender</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Activar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>Total Comercios: {allTenantsForSuperadmin.length}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700 transition"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
