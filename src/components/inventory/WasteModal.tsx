import React, { useState } from 'react';
import { X, AlertTriangle, Check } from 'lucide-react';
import { Product, WasteReason } from '../../types';

interface WasteModalProps {
  product: Product | null;
  onClose: () => void;
  onRecord: (productId: string, quantity: number, reason: WasteReason, notes?: string) => void;
}

export const WasteModal: React.FC<WasteModalProps> = ({ product, onClose, onRecord }) => {
  const [quantity, setQuantity] = useState<string>('1');
  const [reason, setReason] = useState<WasteReason>('consumo_propio');
  const [notes, setNotes] = useState<string>('');

  if (!product) return null;

  const handleConfirm = () => {
    const qty = parseFloat(quantity);
    if (qty > 0) {
      onRecord(product.id, qty, reason, notes.trim() || undefined);
      onClose();
    }
  };

  const isDecimal = product.unit === 'kg' || product.unit === 'litro';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-base text-slate-900">Salida / Merma / Consumo</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Producto:</span>
          <h4 className="text-sm font-bold text-slate-800">{product.name}</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Stock actual: {product.stock} {product.unit}s
          </p>
        </div>

        {/* Motivo */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Motivo de salida:</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as WasteReason)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
          >
            <option value="consumo_propio">Consumo Propio (Dueño / Familia)</option>
            <option value="danado">Producto Dañado / Roto</option>
            <option value="vencido">Producto Vencido</option>
            <option value="otro">Otro ajuste de inventario</option>
          </select>
        </div>

        {/* Cantidad */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Cantidad a descontar ({product.unit}):</label>
          <input
            type="number"
            step={isDecimal ? '0.05' : '1'}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-base font-bold"
          />
        </div>

        {/* Notas */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Notas u observación (Opcional):</label>
          <input
            type="text"
            placeholder="Ej. Se abrió para el almuerzo..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs"
          />
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={onClose}
            className="py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 flex items-center justify-center space-x-1"
          >
            <Check className="w-4 h-4" />
            <span>Registrar Salida</span>
          </button>
        </div>
      </div>
    </div>
  );
};
