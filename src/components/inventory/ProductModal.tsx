import React, { useState } from 'react';
import { X, PackagePlus, DollarSign, Banknote, Sparkles } from 'lucide-react';
import { Product, PricingMode, ProductUnit } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSave: (productData: any) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onSave,
}) => {
  const { toVES, toUSD } = useCurrency();

  const [name, setName] = useState<string>(productToEdit?.name || '');
  const [category, setCategory] = useState<string>(productToEdit?.category || 'Víveres');
  const [pricingMode, setPricingMode] = useState<PricingMode>(productToEdit?.pricingMode || 'USD');
  const [priceUSD, setPriceUSD] = useState<string>(productToEdit?.priceUSD ? productToEdit.priceUSD.toString() : '');
  const [priceVES, setPriceVES] = useState<string>(productToEdit?.priceVES ? productToEdit.priceVES.toString() : '');
  const [costUSD, setCostUSD] = useState<string>(productToEdit?.costUSD ? productToEdit.costUSD.toString() : '');
  const [stock, setStock] = useState<string>(productToEdit?.stock ? productToEdit.stock.toString() : '');
  const [unit, setUnit] = useState<ProductUnit>(productToEdit?.unit || 'unidad');
  const [isBulkPack, setIsBulkPack] = useState<boolean>(productToEdit?.isBulkPack || false);
  const [packUnits, setPackUnits] = useState<string>(productToEdit?.packUnits ? productToEdit.packUnits.toString() : '');
  const [packCostUSD, setPackCostUSD] = useState<string>(productToEdit?.packCostUSD ? productToEdit.packCostUSD.toString() : '');
  const [barcode, setBarcode] = useState<string>(productToEdit?.barcode || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedCost = parseFloat(costUSD) || 0;
    const parsedStock = parseFloat(stock) || 0;
    let finalUSD = 0;
    let finalVES = 0;

    if (pricingMode === 'USD') {
      finalUSD = parseFloat(priceUSD) || 0;
      finalVES = toVES(finalUSD);
    } else {
      finalVES = parseFloat(priceVES) || 0;
      finalUSD = toUSD(finalVES);
    }

    onSave({
      name: name.trim(),
      category: category.trim() || 'Víveres',
      pricingMode,
      priceUSD: finalUSD,
      priceVES: finalVES,
      costUSD: parsedCost,
      stock: parsedStock,
      unit,
      isBulkPack,
      packUnits: isBulkPack ? parseInt(packUnits) || 1 : undefined,
      packCostUSD: isBulkPack ? parseFloat(packCostUSD) || 0 : undefined,
      barcode: barcode.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-brand-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-emerald-500/20 text-brand-emerald-400 flex items-center justify-center">
              <PackagePlus className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base">
              {productToEdit ? 'Editar Producto' : 'Nuevo Producto en Inventario'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700">
          
          {/* Name & Barcode */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800">Nombre del Producto *</label>
            <input
              type="text"
              required
              placeholder="Ej. Harina PAN 1kg, Queso Llanero..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-brand-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-white"
              >
                <option value="Víveres">Víveres</option>
                <option value="Charcutería">Charcutería</option>
                <option value="Bebidas">Bebidas</option>
                <option value="Chucherías">Chucherías</option>
                <option value="Limpieza">Limpieza</option>
                <option value="Panadería">Panadería</option>
                <option value="Otros">Otros</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800">Unidad de Medida</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as ProductUnit)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-white"
              >
                <option value="unidad">Unidad (Entero)</option>
                <option value="kg">Kilogramos (kg - Fraccional)</option>
                <option value="g">Gramos (g)</option>
                <option value="litro">Litros (L - Fraccional)</option>
                <option value="paquete">Paquete</option>
              </select>
            </div>
          </div>

          {/* DOBLE ANCLAJE (VITAL) */}
          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-900 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Modalidad de Precio (Doble Anclaje)</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPricingMode('USD')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center space-x-1.5 border transition ${
                  pricingMode === 'USD'
                    ? 'bg-brand-slate-900 text-white border-brand-slate-900 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <DollarSign className="w-4 h-4 text-brand-emerald-400" />
                <span>Anclado a USD ($)</span>
              </button>

              <button
                type="button"
                onClick={() => setPricingMode('VES')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center space-x-1.5 border transition ${
                  pricingMode === 'VES'
                    ? 'bg-brand-slate-900 text-white border-brand-slate-900 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-4 h-4 text-blue-400" />
                <span>Fijo en Bs (Menudeo)</span>
              </button>
            </div>

            {pricingMode === 'USD' ? (
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Precio de Venta Base ($):</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={priceUSD}
                  onChange={(e) => setPriceUSD(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-black bg-white"
                />
                <span className="text-[11px] text-slate-500 block">
                  El sistema calculará automáticamente los Bs al cobrar según la tasa del momento.
                </span>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Precio de Venta Fijo (Bs):</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={priceVES}
                  onChange={(e) => setPriceVES(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-black bg-white"
                />
                <span className="text-[11px] text-slate-500 block">
                  Precio fijo en bolívares (ej. chucherías). Se convertirá a USD en reportes de ganancia.
                </span>
              </div>
            )}
          </div>

          {/* Cost & Initial Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800">Último Costo ($ USD) *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="Costo unitario en $"
                value={costUSD}
                onChange={(e) => setCostUSD(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800">Stock Inicial ({unit})</label>
              <input
                type="number"
                step={unit === 'kg' || unit === 'litro' ? '0.01' : '1'}
                required
                placeholder="Cantidad actual"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
              />
            </div>
          </div>

          {/* Bultos y Despiece Configuration */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-800">
              <input
                type="checkbox"
                checked={isBulkPack}
                onChange={(e) => setIsBulkPack(e.target.checked)}
                className="rounded text-brand-emerald-600"
              />
              <span>¿Este producto se compra en bultos / cajas?</span>
            </label>

            {isBulkPack && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Unidades por Bulto:</label>
                  <input
                    type="number"
                    placeholder="Ej. 20, 24..."
                    value={packUnits}
                    onChange={(e) => setPackUnits(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Costo del Bulto ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ej. 18.50"
                    value={packCostUSD}
                    onChange={(e) => setPackCostUSD(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-bold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Barcode */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800">Código de Barras / SKU (Opcional)</label>
            <input
              type="text"
              placeholder="Escanea o escribe código..."
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-brand-emerald-600 text-white font-bold hover:bg-brand-emerald-700 shadow-md transition"
            >
              Guardar Producto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
