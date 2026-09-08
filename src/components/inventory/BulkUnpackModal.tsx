import React, { useState } from 'react';
import { X, Box, Check, ArrowRight } from 'lucide-react';
import { Product } from '../../types';

interface BulkUnpackModalProps {
  product: Product | null;
  onClose: () => void;
  onUnpack: (productId: string, packs: number) => void;
}

export const BulkUnpackModal: React.FC<BulkUnpackModalProps> = ({
  product,
  onClose,
  onUnpack,
}) => {
  const [packs, setPacks] = useState<number>(1);

  if (!product) return null;

  const packUnits = product.packUnits || 20;
  const unitsToAdd = packs * packUnits;

  const handleConfirm = () => {
    if (packs > 0) {
      onUnpack(product.id, packs);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Box className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-base text-slate-900">Despiece de Bulto</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Producto:</span>
          <h4 className="text-sm font-bold text-slate-800">{product.name}</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Cada bulto contiene: <strong>{packUnits} {product.unit}s</strong>
          </p>
        </div>

        {/* Input */}
        <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <label className="text-xs font-bold text-slate-700">¿Cuántos bultos vas a abrir?</label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="1"
              value={packs}
              onChange={(e) => setPacks(parseInt(e.target.value) || 1)}
              className="w-20 px-3 py-2 rounded-lg border border-slate-300 font-black text-center text-base"
            />
            <span className="text-xs font-bold text-slate-600">bulto(s)</span>
          </div>

          <div className="pt-2 flex items-center space-x-2 text-xs text-indigo-700 font-semibold">
            <ArrowRight className="w-4 h-4 text-indigo-500" />
            <span>Se sumarán <strong>+{unitsToAdd} {product.unit}s</strong> al stock.</span>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onClose}
            className="py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 flex items-center justify-center space-x-1"
          >
            <Check className="w-4 h-4" />
            <span>Confirmar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
