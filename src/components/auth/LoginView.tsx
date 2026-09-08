import React, { useState } from 'react';
import { 
  Store, 
  ShieldCheck, 
  WifiOff, 
  Sparkles, 
  DollarSign, 
  Smartphone, 
  Layers, 
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { openWhatsAppLink } from '../../services/whatsapp';

export const LoginView: React.FC = () => {
  const { loginWithGoogle } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleLogin = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err?.message?.includes('operation-not-allowed')
          ? 'El proveedor de Google aún no está activado en la consola de Firebase. Actívalo en Authentication > Sign-in method.'
          : 'No se pudo iniciar sesión. Por favor intenta de nuevo.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactWhatsApp = () => {
    const text = encodeURIComponent(
      'Hola Oman, tengo dudas sobre el acceso y activación de BodegaPro.'
    );
    openWhatsAppLink('584124169949', text);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-brand-emerald-500 selection:text-slate-950">
      
      {/* Top Bar */}
      <header className="px-6 py-5 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-emerald-500 to-emerald-300 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Store className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-white">BodegaPro</span>
            <span className="text-[10px] ml-2 font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              v1.0 PWA
            </span>
          </div>
        </div>

        <button
          onClick={handleContactWhatsApp}
          className="text-xs text-slate-400 hover:text-emerald-400 font-semibold flex items-center space-x-1 transition"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Soporte Oman Vásquez</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full space-y-8 my-auto">
          
          {/* Hero text */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SaaS para Bodegas y Comercios</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Tu bodega bajo control, <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                sin enredos en caja.
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
              Doble anclaje USD/Bs, cobros rápidos, fiados inmutables y tickets directos a WhatsApp sin impresoras.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-2 gap-2.5 text-left">
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                <DollarSign className="w-4 h-4" />
                <span>Doble Anclaje</span>
              </div>
              <p className="text-[11px] text-slate-400">Precios base en USD o Bs con tasa DolarAPI y override.</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs">
                <WifiOff className="w-4 h-4" />
                <span>Modo Offline</span>
              </div>
              <p className="text-[11px] text-slate-400">Vende sin internet y sincroniza todo al reconectar.</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs">
                <Smartphone className="w-4 h-4" />
                <span>Fiados en USD</span>
              </div>
              <p className="text-[11px] text-slate-400">Deuda congelada en USD protegida de la devaluación.</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                <Layers className="w-4 h-4" />
                <span>Cierre Diario</span>
              </div>
              <p className="text-[11px] text-slate-400">Arqueo por efectivo $, Bs, Pago Móvil y ganancia neta.</p>
            </div>
          </div>

          {/* Login Card */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4 text-center">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Acceso al Sistema</h3>
              <p className="text-xs text-slate-400">
                Inicia sesión con tu cuenta de Google para acceder o solicitar tu período de prueba.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-left">
                {errorMsg}
              </div>
            )}

            {/* Google Sign-in Button */}
            <button
              onClick={handleLogin}
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm flex items-center justify-center space-x-3 shadow-xl transition active:scale-[0.98] disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isSubmitting ? 'Conectando...' : 'Iniciar Sesión con Google'}</span>
            </button>

            <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Acceso seguro mediante Google Authentication</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center border-t border-slate-900 text-xs text-slate-500">
        <p>
          BodegaPro • Desarrollado por <strong>Oman Vásquez</strong> (+58 412-4169949)
        </p>
      </footer>
    </div>
  );
};
