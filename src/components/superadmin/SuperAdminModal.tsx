import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, XCircle, Store, Clock, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TenantStatus } from '../../types';

interface SuperAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SuperAdminModal: React.FC<SuperAdminModalProps> = ({ isOpen, onClose }) => {
  const { isSuperAdmin, allTenantsForSuperadmin, updateTenantStatus } = useAuth();
  const [filter, setFilter] = useState<string>('todos');

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

  const filtered = allTenantsForSuperadmin.filter((t) => {
    if (filter === 'pendientes') return t.status === 'pendiente';
    if (filter === 'activos') return t.status === 'activo' || t.status === 'trial';
    if (filter === 'inactivos') return t.status === 'inactivo';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[88vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Panel Superadmin</h2>
              <p className="text-xs text-amber-300">
                Control de Accesos y Comercios • Administración
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

        {/* Filter Tabs */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            <button
              onClick={() => setFilter('todos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filter === 'todos' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border'
              }`}
            >
              Todos ({allTenantsForSuperadmin.length})
            </button>
            <button
              onClick={() => setFilter('pendientes')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filter === 'pendientes' ? 'bg-amber-500 text-slate-950' : 'bg-white text-slate-600 border'
              }`}
            >
              Por Aprobar ({allTenantsForSuperadmin.filter((t) => t.status === 'pendiente').length})
            </button>
            <button
              onClick={() => setFilter('activos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filter === 'activos' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border'
              }`}
            >
              Activos / Temporales
            </button>
            <button
              onClick={() => setFilter('inactivos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filter === 'inactivos' ? 'bg-rose-600 text-white' : 'bg-white text-slate-600 border'
              }`}
            >
              Suspendidos
            </button>
          </div>
        </div>

        {/* Content List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {filtered.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-xs font-semibold">
              No hay comercios en esta categoría.
            </p>
          ) : (
            filtered.map((tenant) => {
              const isPendiente = tenant.status === 'pendiente';
              const isTrial = tenant.status === 'trial';
              const isActive = tenant.status === 'activo';
              const isInactive = tenant.status === 'inactivo';

              return (
                <div
                  key={tenant.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 shadow-xs gap-3 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Store className="w-4 h-4 text-slate-500" />
                      <span className="font-bold text-sm text-slate-800">{tenant.name}</span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : isTrial
                            ? 'bg-blue-100 text-blue-800'
                            : isPendiente
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {tenant.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      Encargado: <strong>{tenant.ownerName}</strong> • {tenant.phone}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {tenant.ownerEmail} • ID: {tenant.id}
                    </p>
                  </div>

                  {/* Actions for Oman */}
                  <div className="flex items-center space-x-2 self-end sm:self-center flex-wrap gap-y-2">
                    {isPendiente && (
                      <>
                        <button
                          onClick={() => updateTenantStatus(tenant.id, 'trial', 14)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm flex items-center space-x-1"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Acceso Temporal (14d)</span>
                        </button>
                        <button
                          onClick={() => updateTenantStatus(tenant.id, 'activo')}
                          className="px-3 py-1.5 rounded-xl bg-brand-emerald-600 hover:bg-brand-emerald-700 text-white text-xs font-bold transition shadow-sm flex items-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Habilitar Acceso</span>
                        </button>
                      </>
                    )}

                    {(isActive || isTrial) && (
                      <button
                        onClick={() => updateTenantStatus(tenant.id, 'inactivo')}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition flex items-center space-x-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Suspender</span>
                      </button>
                    )}

                    {isInactive && (
                      <button
                        onClick={() => updateTenantStatus(tenant.id, 'activo')}
                        className="px-3 py-1.5 rounded-xl bg-brand-emerald-600 hover:bg-brand-emerald-700 text-white text-xs font-bold transition flex items-center space-x-1 shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Reactivar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>Total Comercios: {allTenantsForSuperadmin.length}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
