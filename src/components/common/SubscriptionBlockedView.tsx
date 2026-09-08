import React from 'react';
import { Lock, Phone, MessageCircle, Store, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { openWhatsAppLink } from '../../services/whatsapp';

export const SubscriptionBlockedView: React.FC = () => {
  const { tenant } = useAuth();

  const handleContactWhatsApp = () => {
    const text = encodeURIComponent(
      `Hola Oman, deseo renovar la suscripción de mi negocio en BodegaPro.\nNegocio: ${tenant.name}\nCorreo: ${tenant.ownerEmail}\nID: ${tenant.id}`
    );
    openWhatsAppLink('584124169949', text);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 mx-auto flex items-center justify-center shadow-lg">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">
            Suscripción Inactiva
          </span>
          <h2 className="text-2xl font-black tracking-tight text-white">
            {tenant.name}
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            El período de prueba o mensualidad de BodegaPro para este comercio ha finalizado.
          </p>
        </div>

        <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-700 text-left text-xs text-slate-300 space-y-2">
          <p className="flex items-center space-x-2 text-white font-bold">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Tus datos e inventario están 100% seguros</span>
          </p>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Para reactivar tu acceso al punto de venta e informes, contáctate directamente con soporte para confirmar tu pago mensual ($4 - $5 USD vía Pago Móvil o Efectivo).
          </p>
        </div>

        <button
          onClick={handleContactWhatsApp}
          className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg transition active:scale-95"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Reactivar por WhatsApp (+58 412-4169949)</span>
        </button>

        <p className="text-[11px] text-slate-500">
          BodegaPro • Desarrollado por Oman Vásquez
        </p>
      </div>
    </div>
  );
};
