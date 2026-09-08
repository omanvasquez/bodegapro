import React from 'react';
import { Clock, MessageCircle, Store, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { openWhatsAppLink } from '../../services/whatsapp';

export const PendingApprovalView: React.FC = () => {
  const { tenant, user, logout } = useAuth();

  const handleContactWhatsApp = () => {
    const text = encodeURIComponent(
      `Hola Oman, me acabo de registrar en BodegaPro:\n• Bodega: ${tenant.name}\n• Encargado: ${tenant.ownerName}\n• Correo: ${user?.email}\n• Teléfono: ${tenant.phone}\nPor favor activa mi acceso o mi período de prueba gratuita.`
    );
    openWhatsAppLink('584124169949', text);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
        
        {/* Status icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/10">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            Registro en Revisión
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight">
            ¡Solicitud Recibida!
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            Hemos registrado los datos de tu comercio en BodegaPro. Para comenzar a operar, tu cuenta debe ser aprobada por el administrador.
          </p>
        </div>

        {/* Details Card */}
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 text-left text-xs space-y-2">
          <div className="flex items-center space-x-2 text-white font-bold pb-1 border-b border-slate-700">
            <Store className="w-4 h-4 text-brand-emerald-400" />
            <span className="truncate">{tenant.name}</span>
          </div>
          <div className="text-[11px] text-slate-400 space-y-1">
            <p><strong>Encargado:</strong> {tenant.ownerName}</p>
            <p><strong>Correo:</strong> {user?.email}</p>
            <p><strong>Teléfono:</strong> {tenant.phone}</p>
          </div>
        </div>

        {/* WhatsApp Call to action */}
        <div className="space-y-3">
          <button
            onClick={handleContactWhatsApp}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center space-x-2 shadow-xl shadow-emerald-900/30 transition active:scale-[0.98]"
          >
            <MessageCircle className="w-5 h-5 text-slate-950 fill-slate-950" />
            <span>Contactar a Oman Vásquez por WhatsApp</span>
          </button>
          
          <p className="text-[11px] text-slate-500">
            Haz clic para enviar tus datos directamente a Oman y habilitar tus 14 días de prueba o plan activo.
          </p>
        </div>

        {/* Logout */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>{user?.email}</span>
          <button
            onClick={logout}
            className="flex items-center space-x-1 text-slate-400 hover:text-rose-400 font-bold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
};
