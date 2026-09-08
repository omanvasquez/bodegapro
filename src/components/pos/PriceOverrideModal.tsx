import React, { useState } from 'react';
import { X, Tag, RotateCcw } from 'lucide-react';
import { CartItem } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';

interface PriceOverrideModalProps {
  item: CartItem | null;
  onClose: () => void;
  onSave: (newPriceUSD: number) => void;
  onReset: () => void;
}

export const PriceOverrideModal: React.FC<PriceOverrideModalProps> = ({
  item,
  onClose,
  onSave,
  onReset,
}) => {
  if (!item) return null;

  const { toVES } = useCurrency();
  const [priceUSD, setPriceUSD] = useState<string>(item.finalPriceUSD.toString());

  const handleSave = () => {
    const val = parseFloat(priceUSD);
    if (!isNaN(val) && val >= 0) {
      onSave(val);
      onClose();
    }
  };

  const handleReset = () => {
    onReset();
    onClose();
  };

  const currentUSD = parseFloat(priceUSD) || 0;
  const currentVES = toVES(currentUSD);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Tag className="w-5 h-5 text-brand-emerald-600" />
            <h3 className="font-bold text-base text-slate-900">Ajuste de Precio al Vuelo</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <p className="text-xs text-slate-500 font-medium">Producto:</p>
          <p className="text-sm font-bold text-slate-800 truncate">{item.product.name}</p>
          <p className="text-xs text-slate-400">
            Precio de catálogo: ${item.originalPriceUSD.toFixed(2)} (Bs {item.originalPriceVES.toFixed(2)})
          </p>
        </div>

        {/* Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Nuevo Precio de Venta ($):</label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-slate-400 font-bold">$</span>
            <input
              type="number"
              step="0.01"
              value={priceUSD}
              onChange={(e) => setPriceUSD(e.target.value)}
              className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-300 text-lg font-black text-slate-900 focus:ring-2 focus:ring-brand-emerald-500 focus:outline-none"
            />
          </div>
          <p className="text-xs text-slate-500 font-semibold text-right">
            Equivalente en Bs: Bs {currentVES.toFixed(2)}
          </p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={handleReset}
            className="py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition flex items-center justify-center space-x-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Precio Original</span>
          </button>
          <button
            onClick={handleSave}
            className="py-2.5 px-3 rounded-xl bg-brand-emerald-600 text-white text-xs font-bold hover:bg-brand-emerald-700 transition"
          >
            Aplicar Ajuste
          </button>
        </div>
      </div>
    </div>
  );
};
