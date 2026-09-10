import React, { useState } from 'react';
import { Store, User, Phone, ArrowRight, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const RegisterTenantView: React.FC = () => {
  const { user, registerTenant, logout } = useAuth();

  const [businessName, setBusinessName] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>(user?.name || '');
  const [phone, setPhone] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !phone.trim()) return;

    setIsSubmitting(true);
    registerTenant({
      name: businessName.trim(),
      ownerName: ownerName.trim() || user?.name || 'Comerciante',
      phone: phone.trim(),
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-emerald-500 to-emerald-300 flex items-center justify-center mx-auto text-slate-950 shadow-lg shadow-emerald-500/20">
            <Store className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Registra tu Comercio
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Indica los datos de tu comercio para dar de alta tu cuenta y validar tu acceso.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300 flex items-center space-x-1.5">
              <Store className="w-3.5 h-3.5 text-emerald-400" />
              <span>Nombre Comercial de la Bodega *</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Bodega y Víveres Don Pedro"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-brand-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-300 flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>Nombre del Encargado / Dueño</span>
            </label>
            <input
              type="text"
              required
              placeholder="Tu nombre completo"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-brand-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-300 flex items-center space-x-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Número de Teléfono (WhatsApp) *</span>
            </label>
            <input
              type="tel"
              required
              placeholder="Ej. 04121234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-brand-emerald-500"
            />
            <span className="text-[10px] text-slate-500 block">
              Se usará para enlazar el envío de comprobantes y comunicarte con el soporte.
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-brand-emerald-600 hover:bg-brand-emerald-500 text-slate-950 font-black text-sm transition shadow-lg flex items-center justify-center space-x-2 active:scale-[0.98] disabled:opacity-50"
          >
            <span>Enviar Solicitud de Registro</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Logout */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span className="truncate max-w-[200px]">Sesión: {user?.email}</span>
          <button
            onClick={logout}
            className="flex items-center space-x-1 text-slate-400 hover:text-rose-400 font-bold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Salir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
