import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Monitor, 
  Smartphone, 
  Apple, 
  CheckCircle2, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDirectInstall?: () => void;
  hasPrompt?: boolean;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  onDirectInstall,
  hasPrompt = false,
}) => {
  const [activeTab, setActiveTab] = useState<'pc' | 'android' | 'ios'>('pc');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-emerald-500 to-emerald-300 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <Download className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white">Instalar BodegaPro</h3>
              <p className="text-xs text-brand-emerald-400 font-medium">
                PWA Oficial para PC, Laptops y Teléfonos
              </p>
            </div>
          </div>
        </div>

        {/* Direct Install Banner if browser supports prompt */}
        {hasPrompt && onDirectInstall && (
          <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-b border-emerald-200 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-emerald-800 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>¡Tu dispositivo permite instalación directa!</span>
                </span>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Presiona el botón para instalar BodegaPro inmediatamente en tu pantalla.
                </p>
              </div>
              <button
                onClick={onDirectInstall}
                className="px-4 py-2.5 rounded-xl bg-brand-emerald-600 hover:bg-brand-emerald-700 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-md transition shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Instalar Ahora</span>
              </button>
            </div>
          </div>
        )}

        {/* Device selector tabs */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('pc')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
              activeTab === 'pc'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>PC / Laptop</span>
          </button>

          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
              activeTab === 'android'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android</span>
          </button>

          <button
            onClick={() => setActiveTab('ios')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
              activeTab === 'ios'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Apple className="w-3.5 h-3.5" />
            <span>iPhone</span>
          </button>
        </div>

        {/* Tab content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700">
          
          {/* PC Tab */}
          {activeTab === 'pc' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100">
                <p className="font-bold text-indigo-950 text-xs">
                  🖥️ Experiencia de Caja Registradora Profesional en PC
                </p>
                <p className="text-[11px] text-indigo-800 mt-1 leading-relaxed">
                  Al instalar en tu computadora (Windows, Mac o Linux), BodegaPro se abre en su propia ventana sin barra de direcciones ni pestañas del navegador, permitiendo atender a los clientes con máxima velocidad.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black flex items-center justify-center text-[11px] shrink-0">
                    1
                  </span>
                  <div>
                    <strong className="text-slate-900 block">Busca el ícono en la barra de direcciones</strong>
                    <span className="text-slate-500">
                      En Google Chrome o Microsoft Edge, observa arriba a la derecha en la barra de URL. Verás un icono de pantalla con una flecha o un botón <strong>[ ⊕ Instalar ]</strong>.
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black flex items-center justify-center text-[11px] shrink-0">
                    2
                  </span>
                  <div>
                    <strong className="text-slate-900 block">O usa el menú del navegador (⋮)</strong>
                    <span className="text-slate-500">
                      Haz clic en los 3 puntos arriba a la derecha de Chrome &gt; <strong>Guardar y compartir</strong> &gt; <strong>Instalar BodegaPro...</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-brand-emerald-600 text-white font-black flex items-center justify-center text-[11px] shrink-0">
                    3
                  </span>
                  <div>
                    <strong className="text-slate-900 block">¡Listo en tu Escritorio!</strong>
                    <span className="text-slate-500">
                      Se creará un acceso directo en tu Escritorio y podrás anclarlo a la Barra de Tareas para abrir tu caja con un solo clic.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Android Tab */}
          {activeTab === 'android' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                <p className="font-bold text-emerald-950 text-xs">
                  📱 Aplicación PWA Nativa para Celulares Android
                </p>
                <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
                  Gracias a los nuevos iconos de alta resolución y el Service Worker activo, tu teléfono reconocerá BodegaPro como una aplicación completa (no un simple acceso directo), funcionando en pantalla completa y con caché offline.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black flex items-center justify-center text-[11px] shrink-0">
                    1
                  </span>
                  <div>
                    <strong className="text-slate-900 block">Abre el menú de Google Chrome</strong>
                    <span className="text-slate-500">
                      Toca el menú de los 3 puntos verticales <strong>(⋮)</strong> en la esquina superior derecha del navegador.
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black flex items-center justify-center text-[11px] shrink-0">
                    2
                  </span>
                  <div>
                    <strong className="text-slate-900 block">Selecciona "Instalar aplicación"</strong>
                    <span className="text-slate-500">
                      Verás la opción <strong>"Instalar aplicación"</strong> (o "Agregar a la pantalla principal").
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-brand-emerald-600 text-white font-black flex items-center justify-center text-[11px] shrink-0">
                    3
                  </span>
                  <div>
                    <strong className="text-slate-900 block">Confirma la Instalación</strong>
                    <span className="text-slate-500">
                      Toca <strong>Instalar</strong>. El icono verde de BodegaPro aparecerá en tu lista de aplicaciones y pantalla de inicio como una App instalada.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* iOS Tab */}
          {activeTab === 'ios' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200">
                <p className="font-bold text-slate-900 text-xs">
                  🍏 Instalación en iPhone y iPad (Safari)
                </p>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  En dispositivos Apple, la instalación de aplicaciones web PWA se realiza a través del navegador oficial Safari con el botón Compartir.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black flex items-center justify-center text-[11px] shrink-0">
                    1
                  </span>
                  <div>
                    <strong className="text-slate-900 block">Toca el botón Compartir</strong>
                    <span className="text-slate-500">
                      En la barra inferior de Safari, presiona el icono de <strong>Compartir</strong> (un recuadro con una flecha hacia arriba).
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black flex items-center justify-center text-[11px] shrink-0">
                    2
                  </span>
                  <div>
                    <strong className="text-slate-900 block">Selecciona "Agregar a inicio"</strong>
                    <span className="text-slate-500">
                      Desliza el menú de opciones hacia abajo y pulsa <strong>"Agregar a la pantalla de inicio"</strong>.
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-brand-emerald-600 text-white font-black flex items-center justify-center text-[11px] shrink-0">
                    3
                  </span>
                  <div>
                    <strong className="text-slate-900 block">Toca "Agregar"</strong>
                    <span className="text-slate-500">
                      En la esquina superior derecha pulsa <strong>Agregar</strong>. BodegaPro se abrirá como app nativa a pantalla completa.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feature Badges */}
          <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500 font-semibold">
            <div className="p-2 rounded-xl bg-slate-50">
              <span className="block text-slate-900 font-bold">⚡ Carga Rápida</span>
              <span>Caché local</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50">
              <span className="block text-slate-900 font-bold">🖥️ Sin Barras</span>
              <span>Pantalla limpia</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50">
              <span className="block text-slate-900 font-bold">🔒 Sincronizado</span>
              <span>Google Cloud</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
