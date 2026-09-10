import React from 'react';
import { 
  X, 
  Globe, 
  Phone, 
  Github, 
  BookOpen, 
  Linkedin, 
  Instagram, 
  Twitter, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-brand-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-emerald-500 to-emerald-300 flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">BodegaPro</h2>
              <p className="text-xs text-brand-emerald-500 font-semibold uppercase tracking-wider">
                Versión 1.0 • Gestión Comercial
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-slate-700 max-h-[75vh] overflow-y-auto">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Desarrollado por</h3>
            <p className="text-lg font-black text-brand-slate-800">Oman Vásquez</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Software Architect • Cojedes, Venezuela
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70 text-xs text-slate-600 leading-relaxed">
            <p className="flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-brand-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>BodegaPro</strong> es una solución de gestión comercial diseñada para optimizar bodegas y comercios mediante control de inventario con doble anclaje (USD/Bs), punto de venta offline-first y registro de cuentas de clientes.
              </span>
            </p>
          </div>

          {/* Social and Web Links */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Enlaces y Redes</p>
            
            <a
              href="https://oman-vasquez.web.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-sm font-medium transition text-slate-800 hover:text-brand-emerald-600"
            >
              <div className="flex items-center space-x-3">
                <Globe className="w-4 h-4 text-indigo-500" />
                <span>Sitio Web Oficial</span>
              </div>
              <span className="text-xs text-slate-400">oman-vasquez.web.app</span>
            </a>

            <a
              href="https://wa.me/584124169949"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 text-sm font-medium transition text-emerald-900"
            >
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp de Contacto</span>
              </div>
              <span className="text-xs text-emerald-700 font-bold">+58 412-4169949</span>
            </a>

            <a
              href="https://github.com/omanvasquez"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-sm font-medium transition text-slate-800 hover:text-brand-slate-900"
            >
              <div className="flex items-center space-x-3">
                <Github className="w-4 h-4 text-slate-800" />
                <span>GitHub (Otros Programas)</span>
              </div>
              <span className="text-xs text-slate-400">@omanvasquez</span>
            </a>

            <a
              href="https://omanvasquez.substack.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-sm font-medium transition text-slate-800 hover:text-orange-600"
            >
              <div className="flex items-center space-x-3">
                <BookOpen className="w-4 h-4 text-orange-500" />
                <span>Blog & Substack</span>
              </div>
              <span className="text-xs text-slate-400">omanvasquez.substack.com</span>
            </a>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <a
                href="https://www.linkedin.com/in/omanvasquez/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/70 text-xs font-medium text-slate-700 hover:text-blue-600 transition"
              >
                <Linkedin className="w-4 h-4 text-blue-600" />
                <span>LinkedIn</span>
              </a>

              <a
                href="https://www.instagram.com/omanvasquez_/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-pink-50 border border-slate-200/70 text-xs font-medium text-slate-700 hover:text-pink-600 transition"
              >
                <Instagram className="w-4 h-4 text-pink-600" />
                <span>Instagram</span>
              </a>

              <a
                href="https://x.com/omanvasquez_/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-xs font-medium text-slate-700 hover:text-black transition"
              >
                <Twitter className="w-4 h-4 text-slate-900" />
                <span>X</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100/80 px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-brand-slate-900 text-white text-sm font-semibold hover:bg-brand-slate-800 transition shadow-sm"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
